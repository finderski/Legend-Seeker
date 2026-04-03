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

//Tally Total Weight Carried
on('change:total_weapon_weight change:total_equipment_weight', function () {
    getAttrs(['total_weapon_weight', 'total_equipment_weight'], function (values) {
        let weaponWeight = parseFloat(values['total_weapon_weight']) || 0;
        let equipmentWeight = parseFloat(values['total_equipment_weight']) || 0;
        log("total equipment weight", equipmentWeight, "orange");
        log("total weapon weight", weaponWeight, "orange");

        let totalCarriedWeight = weaponWeight + equipmentWeight;

        let attrsToSet = {};
        log('total weight carried', JSON.stringify(attrsToSet['total_weight_carried']),'pink');
        attrsToSet['total_weight_carried'] = totalCarriedWeight;
        setAttrs(attrsToSet);
    });
});

// Calculate Encumbrance Level
on('change:total_weight_carried change:total_ps', function () {
    getAttrs(['total_weight', 'total_ps'], function (values) {
        let totalWeight = parseFloat(values['total_weight']) || 0;
        let totalPS = parseFloat(values['total_ps']) || 0;

        // Unburdened: >= total_ps
        // Burdened: > total_ps and <= total_ps * 2
        // Heavily Burdened: > total_ps * 2

        let encumbranceLevel = 1; // Default to Unburdened

        if (totalWeight > totalPS * 2) {
            encumbranceLevel = 3; // Heavily Burdened
        } else if (totalWeight > totalPS) {
            encumbranceLevel = 2; // Burdened
        }

        let attrsToSet = {};
        attrsToSet['encumbrance_level'] = encumbranceLevel;
        setAttrs(attrsToSet);
    });
});
