function calculateEncumbrance() {
    getAttrs(['total_weight_carried', 'strength', 'strength_adjusted', 'current_character_type', 'monster_size', 'speed','ignore-encumbrance'], function (values) {
        const totalWeight = parseFloat(values['total_weight_carried']) || 0;
        const characterStrength = parseFloat(values['strength']) || 0;
        const characterStrengthAdjusted = parseFloat(values['strength_adjusted']) || 0;
        const characterType = parseInt(values['current_character_type'], 10) || 1;
        const monsterSize = values['monster_size'].toLowerCase() || 'medium';
        const characterSpeed = parseFloat(values['speed']) || 0;
        const ignoreEncumbrance = parseInt(values['ignore-encumbrance'], 10) || 0;

        // Heavy Load: > (characterStrength/2)^2
        let loadCalc = Math.pow(characterStrength / 2, 2);
        const monsterLoadCalc = Math.pow(characterStrengthAdjusted / 2, 2);
        log("Initial Encumbrance Calculation", `Strength: ${characterStrength}, Adjusted Strength: ${characterStrengthAdjusted}, Half Strength: ${characterStrength / 2}, Squared: ${loadCalc}, Half Adjusted: ${characterStrengthAdjusted / 2}, Squared: ${monsterLoadCalc}`, derivedStatsColor);
        loadCalc = characterType === 4 ? monsterLoadCalc * (sizeModifiers[`${monsterSize}`]?.carryingCapacityMultiplier || 0) : loadCalc;
        log("Adjusted Encumbrance Calculation", `Character Type: ${characterType}, Monster Size: ${monsterSize}, Multiplier: ${sizeModifiers[`${monsterSize}`]?.carryingCapacityMultiplier || 0},   Load Calc: ${loadCalc}`, derivedStatsColor);
        const encumbrancePenalty = totalWeight >= loadCalc ? -10 : 0;
        log("Encumbrance Calculation", `Total Weight: ${totalWeight}, Load Calc: ${loadCalc}, Encumbrance Penalty: ${encumbrancePenalty}`, derivedStatsColor);
        const adjustedSpeed = encumbrancePenalty === -10 ? Math.floor(characterSpeed*0.75) : characterSpeed;
        const carryCapacity = loadCalc - 0.1; // Subtracting 0.1 to ensure that the character is not considered encumbered when at the exact threshold
        let attrsToSet = {};
        if (ignoreEncumbrance) {
            log("Encumbrance Calculation", "Encumbrance is ignored due to settings.", derivedStatsColor);
            attrsToSet['encumbrance_penalty'] = 0;
            attrsToSet['adjusted_speed'] = characterSpeed;
        }
        else {
            attrsToSet['encumbrance_penalty'] = encumbrancePenalty;
            attrsToSet['adjusted_speed'] = adjustedSpeed;
        }
        attrsToSet['carry_capacity'] = carryCapacity.toFixed(1);
        setAttrs(attrsToSet);
    });
}
// Calculate Weapon Weight
function calculateWeaponWeight() {
    getSectionIDs('repeating_weapons', function (ids) {
        if (!ids.length) {
            setAttrs({ total_weapon_weight: 0 });
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

            setAttrs({ total_weapon_weight: totalWeaponWeight });
        });
    });
}

on('change:repeating_weapons:weapon-quantity change:repeating_weapons:weapon-weight change:repeating_weapons:weapon_carried remove:repeating_weapons', calculateWeaponWeight);

// Calculate Armor and Shield Weight
function calculateArmorWeight() {
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

        setAttrs(attrsToSet);
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
function calculateItemWeight() {
    repeatingSimpleSumWCheck(
        'equipment',
        'item_total_weight',
        'total_item_weight',
        'item_carried',
        '1'
    );
}

on('change:repeating_equipment:item_total_weight change:repeating_equipment:item_carried remove:repeating_equipment', calculateItemWeight);

on('change:copper change:silver change:gold change:platinum', function () {
    getAttrs(['copper', 'silver', 'gold', 'platinum'], function (values) {
        const copper = parseFloat(values['copper']) || 0;
        const silver = parseFloat(values['silver']) || 0;
        const gold = parseFloat(values['gold']) || 0;
        const platinum = parseFloat(values['platinum']) || 0;
        const totalCoins = copper + silver + gold + platinum;
        const totalCoinWeight = Math.floor(totalCoins / 25) / 2; // Assuming 50 coins weigh 1 lb, and we want to round down to the nearest half pound

        setAttrs({ total_coin_weight: totalCoinWeight });
    });
});

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

on('sheet:opened', function () {
    calculateWeaponWeight();
    calculateArmorWeight();
    calculateItemWeight();
});

// Calculate Encumbrance
on('change:total_weight_carried change:strength change:strength_adjusted change:current_character_type change:monster_size', function () {
    calculateEncumbrance();
});
