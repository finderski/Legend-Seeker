// Calculate Weapon Weight
on('change:repeating_weapons:weapon_weight change:repeating_weapons:weapon_carried remove:repeating_weapons', function (eventInfo) {
    repeatingSimpleSumWCheck(
        'weapons',
        'weapon_weight',
        'total_weapon_weight',
        'weapon_carried',
        '1'
    );
});

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
on('change:repeating_equipment:item_total_weight change:repeating_equipment:item_carried remove:repeating_equipment', function (eventInfo) {
    repeatingSimpleSumWCheck(
        'equipment',
        'item_total_weight',
        'total_equipment_weight',
        'item_carried',
        '1'
    );
});

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

//Tally Total Weight Carried
on('change:total_weapon_weight change:total_equipment_weight change:total_coin_weight', function () {
    getAttrs(['total_weapon_weight', 'total_equipment_weight', 'total_coin_weight'], function (values) {
        let weaponWeight = parseFloat(values['total_weapon_weight']) || 0;
        let equipmentWeight = parseFloat(values['total_equipment_weight']) || 0;
        let coinWeight = parseFloat(values['total_coin_weight']) || 0;
        log("total equipment weight", equipmentWeight, "orange");
        log("total weapon weight", weaponWeight, "orange");
        log("total coin weight", coinWeight, "orange");

        let totalCarriedWeight = weaponWeight + equipmentWeight + coinWeight;

        let attrsToSet = {};
        log('total weight carried', JSON.stringify(attrsToSet['total_weight_carried']),'pink');
        attrsToSet['total_weight_carried'] = totalCarriedWeight;
        setAttrs(attrsToSet);
    });
});

// Calculate Encumbrance
on('change:total_weight_carried change:strength change:current_character_type change:monster_size', function () {
    getAttrs(['total_weight_carried', 'strength', 'current_character_type', 'monster_size', 'speed'], function (values) {
        const totalWeight = parseFloat(values['total_weight']) || 0;
        const characterStrength = parseFloat(values['strength']) || 0;
        const characterType = parseInt(values['current_character_type'], 10) || 1;
        const monsterSize = values['monster_size'].toLowerCase() || 'medium';
        const characterSpeed = parseFloat(values['speed']) || 0;

        // Heavy Load: > (characterStrength/2)^2
        let loadCalc = Math.pow(characterStrength / 2, 2);
        loadCalc = characterType === 4 ? loadCalc * (sizeModifiers[`${monsterSize}`]?.carryingCapacityMultiplier || 0) : loadCalc;
        const encumbrancePenalty = totalWeight >= loadCalc ? -10 : 0;
        const adjustedSpeed = encumbrancePenalty === -10 ? Math.floor(characterSpeed*0.75) : characterSpeed;

        let attrsToSet = {};
        attrsToSet['carry_capacity'] = loadCalc - 0.1; // Subtracting 0.1 to ensure that the character is not considered encumbered when at the exact threshold
        attrsToSet['encumbrance_penalty'] = encumbrancePenalty;
        attrsToSet['adjusted_speed'] = adjustedSpeed;
        setAttrs(attrsToSet);
    });
});
