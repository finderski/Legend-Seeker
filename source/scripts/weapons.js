// Sheet Workers for Weapons

on('change:repeating_weapons:weapon change:repeating_weapons:weapon-atk-bonus change:repeating_weapons:weapon-misc-mod change:heroic-proficiency-bonus', function(eventInfo) {
    const fields = [];
    if (eventInfo.sourceAttribute === 'heroic-proficiency-bonus') {
        // Heroic Proficiency Trigger - must update ALL weapons
        getSectionIDs('repeating_weapons', function(ids) {
            ids.forEach(function(id) {
                calculateWeaponAttack(id);
            });
        });
    }
    else {
        // Grab only the values for the current weapon
        fields.push("heroic-proficiency-bonus","repeating_weapons_weapon-atk-bonus","repeating_weapons_weapon-misc-mod");
        getAttrs(fields, function(values) {
            // do the work
            const hpb = parseInt(values['heroic-proficiency-bonus']) || 0;
            const atkBonus = parseInt(values['repeating_weapons_weapon-atk-bonus']) || 0;
            const miscMod = parseInt(values['repeating_weapons_weapon-misc-mod']) || 0;

            const totalAtk = hpb + atkBonus + miscMod;
        });
    }
});