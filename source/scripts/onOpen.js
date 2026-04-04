// Need to make sure that every weapon has the half level and heroic proficiency attributes, even if they aren't used, so that the calculations for those attributes work properly.
on('sheet:opened', function() {
    log('Sheet Opened',"Updating weapon attributes to ensure calculations work", r20color);
    getSectionIDs('repeating_weapons', function(ids) {
        getAttrs(['heroic_proficiency_bonus','half-level'], function(values) {
            ids.forEach(function(id) {
                const attrsToSet = {};
                attrsToSet[`repeating_weapons_${id}_weapon-half-level`] = values['half-level'] || 0;
                attrsToSet[`repeating_weapons_${id}_weapon-heroic-proficiency`] = values['heroic_proficiency_bonus'] || 0;
                setAttrs(attrsToSet);
            });
        });
    });
});