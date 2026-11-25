const HEAVY_LOAD_BASES = [100, 115, 130, 150, 175, 200, 230, 260, 300, 350];

function getHeavyLoadCapacity(strength) {
    const normalizedStrength = Math.max(0, Math.floor(parseFloat(strength) || 0));
    if (normalizedStrength < 10) {
        return normalizedStrength * 10;
    }

    const baseIndex = (normalizedStrength - 10) % 10;
    const decade = Math.floor((normalizedStrength - 10) / 10);
    return HEAVY_LOAD_BASES[baseIndex] * Math.pow(4, decade);
}

function calculateEffectiveCheckPenalty(callback) {
    getAttrs(['armor_check_penalty', 'encumbrance_penalty'], function (values) {
        const armorPenalty = parseInt(values.armor_check_penalty, 10) || 0;
        const encumbrancePenalty = parseInt(values.encumbrance_penalty, 10) || 0;
        const effectivePenalty = Math.min(0, armorPenalty, encumbrancePenalty);
        setAttrs({ effective_check_penalty: effectivePenalty }, {}, function () {
            if (typeof callback === 'function') callback(effectivePenalty);
        });
    });
}

on('change:armor_check_penalty change:encumbrance_penalty', calculateEffectiveCheckPenalty);

function calculateEncumbrance(callback) {
    getAttrs([
        'total_weight_carried',
        'strength',
        'strength_adjusted',
        'current_character_type',
        'monster_size',
        'speed',
        'armor_check_penalty',
        'ignore-encumbrance',
        'apply-npc-encumbrance'
    ], function (values) {
        const totalWeight = parseFloat(values.total_weight_carried) || 0;
        const characterStrength = parseFloat(values.strength) || 0;
        const adjustedStrengthValue = parseFloat(values.strength_adjusted);
        const characterType = parseInt(values.current_character_type, 10) || 1;
        const monsterSize = (values.monster_size || 'medium').toLowerCase();
        const characterSpeed = parseFloat(values.speed) || 0;
        const ignoreEncumbrance = parseInt(values['ignore-encumbrance'], 10) === 1;
        const applyNpcEncumbrance = values['apply-npc-encumbrance'] !== '0';
        const isNpc = characterType === 4;
        const capacityStrength = isNpc && !isNaN(adjustedStrengthValue)
            ? adjustedStrengthValue
            : characterStrength;
        const sizeMultiplier = isNpc
            ? (sizeModifiers[monsterSize]?.carryingCapacityMultiplier || 1)
            : 1;
        const heavyLoadMaximum = getHeavyLoadCapacity(capacityStrength) * sizeMultiplier;
        const lightLoadMaximum = Math.floor(heavyLoadMaximum / 3);
        const mediumLoadMaximum = Math.floor((heavyLoadMaximum * 2) / 3);
        const loadCategory = totalWeight <= lightLoadMaximum
            ? 'light'
            : totalWeight <= mediumLoadMaximum
                ? 'medium'
                : 'heavy';
        const effectsEnabled = !ignoreEncumbrance && (!isNpc || applyNpcEncumbrance);
        const encumbrancePenalty = !effectsEnabled || loadCategory === 'light'
            ? 0
            : loadCategory === 'medium'
                ? -2
                : -4;
        const encumbranceMaxDex = !effectsEnabled || loadCategory === 'light'
            ? 1000
            : loadCategory === 'medium'
                ? 3
                : 1;
        const adjustedSpeed = effectsEnabled && loadCategory === 'heavy'
            ? Math.floor(characterSpeed * 0.75)
            : characterSpeed;
        const overCapacity = effectsEnabled && totalWeight > heavyLoadMaximum ? 1 : 0;
        const armorCheckPenalty = parseInt(values.armor_check_penalty, 10) || 0;
        const effectiveCheckPenalty = Math.min(0, armorCheckPenalty, encumbrancePenalty);
        const attrsToSet = {
            carry_capacity: parseFloat(heavyLoadMaximum.toFixed(2)),
            encumbrance_load: loadCategory,
            encumbrance_penalty: encumbrancePenalty,
            effective_check_penalty: effectiveCheckPenalty,
            encumbrance_max_dex: encumbranceMaxDex,
            adjusted_speed: adjustedSpeed,
            over_carry_capacity: overCapacity
        };

        log(
            "Encumbrance Calculation",
            `Weight: ${totalWeight}, Strength: ${capacityStrength}, Size Multiplier: ${sizeMultiplier}, Light Max: ${lightLoadMaximum}, Medium Max: ${mediumLoadMaximum}, Heavy Max: ${heavyLoadMaximum}, Load: ${loadCategory}, Penalty: ${encumbrancePenalty}, Over Capacity: ${overCapacity}`,
            derivedStatsColor
        );
        setAttrs(attrsToSet, {}, function () {
            if (typeof callback === 'function') callback(attrsToSet);
        });
    });
}
// Calculate Weapon Weight
function calculateWeaponWeight(callback) {
    getSectionIDs('repeating_weapons', function (ids) {
        if (!ids.length) {
            setAttrs({ total_weapon_weight: 0 }, {}, function () {
                if (typeof callback === 'function') callback(0);
            });
            return;
        }

        const fields = [];
        ids.forEach(function (id) {
            fields.push(`repeating_weapons_${id}_weapon-quantity`);
            fields.push(`repeating_weapons_${id}_weapon-weight`);
            fields.push(`repeating_weapons_${id}_weapon_carried`);
        });

        getAttrs(fields, function (values) {
            const totalWeaponWeight = ids.reduce(function (total, id) {
                const quantity = parseInt(values[`repeating_weapons_${id}_weapon-quantity`], 10) || 0;
                const weight = parseFloat(values[`repeating_weapons_${id}_weapon-weight`]) || 0;
                const carried = values[`repeating_weapons_${id}_weapon_carried`] === '1';
                return carried ? total + (quantity * weight) : total;
            }, 0);

            setAttrs({ total_weapon_weight: totalWeaponWeight }, {}, function () {
                if (typeof callback === 'function') callback(totalWeaponWeight);
            });
        });
    });
}

on('change:repeating_weapons:weapon-quantity change:repeating_weapons:weapon-weight change:repeating_weapons:weapon_carried remove:repeating_weapons', calculateWeaponWeight);

// Calculate Armor and Shield Weight
function calculateArmorWeight(callback) {
    getAttrs([
        'armor-quantity',
        'armor-weight',
        'armor_carried',
        'armor_worn',
        'shield-quantity',
        'shield-weight',
        'shield_carried',
        'shield_worn'
    ], function (values) {
        const armorQuantity = parseInt(values['armor-quantity'], 10) || 0;
        const armorWeight = parseFloat(values['armor-weight']) || 0;
        const armorWorn = values.armor_worn === '1';
        const armorCarried = armorWorn || values.armor_carried === '1';
        const shieldQuantity = parseInt(values['shield-quantity'], 10) || 0;
        const shieldWeight = parseFloat(values['shield-weight']) || 0;
        const shieldWorn = values.shield_worn === '1';
        const shieldCarried = shieldWorn || values.shield_carried === '1';
        const totalArmorWeight =
            (armorCarried ? armorQuantity * armorWeight : 0) +
            (shieldCarried ? shieldQuantity * shieldWeight : 0);
        const attrsToSet = { total_armor_weight: totalArmorWeight };

        if (armorWorn && values.armor_carried !== '1') {
            attrsToSet.armor_carried = 1;
        }
        if (shieldWorn && values.shield_carried !== '1') {
            attrsToSet.shield_carried = 1;
        }

        setAttrs(attrsToSet, {}, function () {
            if (typeof callback === 'function') callback(totalArmorWeight);
        });
    });
}

on('change:armor-quantity change:armor-weight change:armor_carried change:armor_worn change:shield-quantity change:shield-weight change:shield_carried change:shield_worn', calculateArmorWeight);

on("change:repeating_equipment:item_quantity change:repeating_equipment:item_weight", function () {
    getAttrs(["repeating_equipment_item_quantity", "repeating_equipment_item_weight"], function (values) {
        let itemQuantity = parseInt(values["repeating_equipment_item_quantity"]) || 0;
        let itemWeight = parseFloat(values["repeating_equipment_item_weight"]) || 0;
        let totalWeight = itemQuantity * itemWeight;

        let attrsToSet = {};
        attrsToSet["repeating_equipment_item_total_weight"] = totalWeight;
        setAttrs(attrsToSet);
    });
});

// Calculate Inventory Weight
function calculateItemWeight(callback) {
    getSectionIDs('repeating_equipment', function (ids) {
        if (!ids.length) {
            setAttrs({ total_item_weight: 0 }, {}, function () {
                if (typeof callback === 'function') callback(0);
            });
            return;
        }

        const fields = [];
        ids.forEach(function (id) {
            fields.push(`repeating_equipment_${id}_item_quantity`);
            fields.push(`repeating_equipment_${id}_item_weight`);
            fields.push(`repeating_equipment_${id}_item_carried`);
        });

        getAttrs(fields, function (values) {
            const totalItemWeight = ids.reduce(function (total, id) {
                const quantity = parseInt(values[`repeating_equipment_${id}_item_quantity`], 10) || 0;
                const weight = parseFloat(values[`repeating_equipment_${id}_item_weight`]) || 0;
                const carried = values[`repeating_equipment_${id}_item_carried`] === '1';
                return carried ? total + (quantity * weight) : total;
            }, 0);

            setAttrs({ total_item_weight: totalItemWeight }, {}, function () {
                if (typeof callback === 'function') callback(totalItemWeight);
            });
        });
    });
}

on('change:repeating_equipment:item_quantity change:repeating_equipment:item_weight change:repeating_equipment:item_carried remove:repeating_equipment', calculateItemWeight);

function calculateCoinWeight(callback) {
    getAttrs(['copper', 'silver', 'gold', 'platinum'], function (values) {
        const copper = parseFloat(values['copper']) || 0;
        const silver = parseFloat(values['silver']) || 0;
        const gold = parseFloat(values['gold']) || 0;
        const platinum = parseFloat(values['platinum']) || 0;
        const totalCoins = copper + silver + gold + platinum;
        const totalCoinWeight = Math.floor(totalCoins / 25) / 2; // Assuming 50 coins weigh 1 lb, and we want to round down to the nearest half pound

        setAttrs({ total_coin_weight: totalCoinWeight }, {}, function () {
            if (typeof callback === 'function') callback(totalCoinWeight);
        });
    });
}

on('change:copper change:silver change:gold change:platinum', calculateCoinWeight);

// Equipment includes carried inventory and coin weight.
on('change:total_item_weight change:total_coin_weight', function () {
    getAttrs(['total_item_weight', 'total_coin_weight'], function (values) {
        const itemWeight = parseFloat(values.total_item_weight) || 0;
        const coinWeight = parseFloat(values.total_coin_weight) || 0;
        setAttrs({ total_equipment_weight: itemWeight + coinWeight });
    });
});

//Tally Total Weight Carried
on('change:total_weapon_weight change:total_armor_weight change:total_equipment_weight', function () {
    getAttrs(['total_weapon_weight', 'total_armor_weight', 'total_equipment_weight'], function (values) {
        const weaponWeight = parseFloat(values.total_weapon_weight) || 0;
        const armorWeight = parseFloat(values.total_armor_weight) || 0;
        const equipmentWeight = parseFloat(values.total_equipment_weight) || 0;
        log("total equipment weight", equipmentWeight, "orange");
        log("total weapon weight", weaponWeight, "orange");
        log("total armor weight", armorWeight, "orange");

        const totalCarriedWeight = weaponWeight + armorWeight + equipmentWeight;

        const attrsToSet = {};
        log('total weight carried', JSON.stringify(attrsToSet['total_weight_carried']),'pink');
        attrsToSet['total_weight_carried'] = totalCarriedWeight;
        setAttrs(attrsToSet);
    });
});

function recalculateAllWeightTotals(callback) {
    const totals = {};
    let pendingCalculations = 4;
    const finishCalculation = function (key, total) {
        totals[key] = total;
        pendingCalculations -= 1;
        if (pendingCalculations > 0) return;

        const totalEquipmentWeight = totals.item + totals.coin;
        const totalCarriedWeight = totalEquipmentWeight + totals.weapon + totals.armor;
        setAttrs({
            total_equipment_weight: totalEquipmentWeight,
            total_weight_carried: totalCarriedWeight
        }, {}, function () {
            if (typeof callback === 'function') callback(totalCarriedWeight);
        });
    };

    calculateWeaponWeight(total => finishCalculation('weapon', total));
    calculateArmorWeight(total => finishCalculation('armor', total));
    calculateItemWeight(total => finishCalculation('item', total));
    calculateCoinWeight(total => finishCalculation('coin', total));
}

on('sheet:opened', function () {
    recalculateAllWeightTotals(function () {
        calculateEncumbrance();
    });
});

// Calculate Encumbrance
on('change:total_weight_carried change:strength change:strength_adjusted change:current_character_type change:monster_size change:speed change:ignore-encumbrance change:apply-npc-encumbrance', function () {
    calculateEncumbrance();
});
