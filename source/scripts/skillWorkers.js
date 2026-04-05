
/*------------------Update Skill Bonuses------------------*/
// Watch for updates to: Attribute Modifiers, Half-Level, Trained Status, Skill Focus and Misc. Modifiers
// Use the variables: listOfSklls, and listOfAttributes
/*------------------End Skill Bonsuses------------------*/
function recalcSkill(skill) {
    const fields = [
        "half-level",
        `${skill}_attribute`,
        `${skill}_trained`,
        `${skill}_focus`,
        `${skill}_misc`,
        `${skill}_ability`
    ];

    const allFields = [...fields, ...listOfAttributes];
    // log(`list of fields to retrieve`, allFields, r20color);

    getAttrs(allFields, function(values) {
        //log(`Values retrieved for skill ${skill}`, values, r20color);
        //console.log(`Values retrieved for skill ${skill}:`, values);
        const attribute = values[`${skill}_ability`].split("_")[0].replace("@", "").replace("{", "").replace("}", ""); // Extract the attribute name from the skill's linked attribute field
        //log(`Attribute for Skill ${skill}`, attribute, derivedStatsColor);
        //log("value of attribute modifier", values[`${attribute}_modifier`], derivedStatsColor);
        const halfLevel = parseInt(values["half-level"], 10) || 0;
        const trained = parseInt(values[`${skill}_trained`], 10) || 0;
        const focus = parseInt(values[`${skill}_focus`], 10) || 0;
        const misc = parseInt(values[`${skill}_misc`], 10) || 0;
        const abilityMod = parseInt(values[`${attribute}_modifier`], 10) || 0;

        setAttrs({
            [`${skill}_bonus`]: halfLevel + trained + focus + misc + abilityMod
        });
    });
}

//Calculate Half-Level and Re-calculate Skills when Level changes
on('change:level', function(eventInfo) {
    const halfLevelValue = Math.floor((parseInt(eventInfo.newValue)/2 || 0));
    const previousHalfLevelValue = Math.floor((parseInt(eventInfo.previousValue)/2 || 0));

    if (halfLevelValue === previousHalfLevelValue) {
        log("Level Updated", "No Change in Half-Level Value.", derivedStatsColor);
    }
    else {
        
        const setattrs = {};
        setattrs['half-level'] = halfLevelValue;
        setAttrs(setattrs,{silent:true});
        //re-calculate all skills
        listOfSklls.forEach(async (skill) => {
            recalcSkill(skill);
        });
    }
});

// When a skill's Trained, Focus or Misc fields change, re-calculate the skill bonus
listOfSklls.forEach(skill => {
    on(`change:${skill}_trained change:${skill}_focus change:${skill}_misc change:${skill}_ability`, () => {
        recalcSkill(skill);
    });
});

// when an attribute modifier changes, re-calculate all skills that are linked to that attribute
listOfAttributes.forEach(attribute => {
    on(`change:${attribute}`, function() {
        const attributeName = attribute.replace("_modifier", "");
        listOfSklls.forEach(skill => {
            getAttrs([`${skill}_ability`], function(values) {
                const skillAttribute = values[`${skill}_ability`].split("_")[0].replace("@", "").replace("{", "").replace("}", "");
                if (skillAttribute === attributeName) {
                    recalcSkill(skill);
                }
            });
        });
    });
});