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

on("change:repeating_inventory:item_quantity change:repeating_inventory:item_weight", function () {
    getAttrs(["repeating_inventory_item_quantity", "repeating_inventory_item_weight"], function (values) {
        let itemQuantity = parseInt(values["repeating_inventory_item_quantity"]) || 0;
        let itemWeight = parseFloat(values["repeating_inventory_item_weight"]) || 0;
        let totalWeight = itemQuantity * itemWeight;

        let attrsToSet = {};
        attrsToSet["repeating_inventory_item_total_weight"] = totalWeight;
        setAttrs(attrsToSet);
    });
});

// Calculate Inventory Weight
on('change:repeating_inventory:item_total_weight change:repeating_inventory:item_carried remove:repeating_inventory', function (eventInfo) {
    repeatingSimpleSumWCheck(
        'inventory',
        'item_total_weight',
        'total_inventory_weight',
        'item_carried',
        '1'
    );
});

//Tally Total Weight Carried
on('change:total_weapon_weight change:total_inventory_weight', function () {
    getAttrs(['total_weapon_weight', 'total_inventory_weight'], function (values) {
        let weaponWeight = parseFloat(values['total_weapon_weight']) || 0;
        let inventoryWeight = parseFloat(values['total_inventory_weight']) || 0;
        let totalCarriedWeight = weaponWeight + inventoryWeight;

        let attrsToSet = {};
        attrsToSet['total_weight'] = totalCarriedWeight;
        setAttrs(attrsToSet);
    });
});

// Calculate Encumbrance Level
on('change:total_weight change:total_ps', function () {
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

// Update Modified Land Speed based on Encumbrance Level
on('change:encumbrance_level change:speed_land', function () {
    getAttrs(['encumbrance_level', 'speed_land'], function (values) {
        let encumbranceLevel = parseInt(values['encumbrance_level']) || 1;
        let baseLandSpeed = values['speed_land'] || '0 / 0 / 0';

        let speedParts = baseLandSpeed.split('/').map(part => parseInt(part) || 0);
        let modifiedSpeedParts = [...speedParts];
        log("speedParts", modifiedSpeedParts, "darkblue");
        switch (encumbranceLevel) {
            case 2: // Burdened
                modifiedSpeedParts[0] = Math.max(0, Math.ceil(modifiedSpeedParts[0] * .66));
                modifiedSpeedParts[1] = Math.max(0, Math.ceil(modifiedSpeedParts[1] * .66));
                modifiedSpeedParts[2] = Math.max(0, Math.ceil(modifiedSpeedParts[2] * .66));
                break;
            case 3: // Heavily Burdened
                modifiedSpeedParts[0] = Math.max(0, Math.ceil(modifiedSpeedParts[0] * .33));
                modifiedSpeedParts[1] = Math.max(0, Math.ceil(modifiedSpeedParts[1] * .33));
                modifiedSpeedParts[2] = Math.max(0, Math.ceil(modifiedSpeedParts[2] * .33));
                break;
            // Unburdened (case 1) does not modify speed
        }

        let modifiedLandSpeed = modifiedSpeedParts.join(' / ');
        log("Modified Land Speed: ", modifiedLandSpeed, "darkgreen");

        let attrsToSet = {};
        attrsToSet['modified_land_speed'] = modifiedLandSpeed;
        setAttrs(attrsToSet);
    });
});