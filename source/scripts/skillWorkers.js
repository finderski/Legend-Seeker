
/*------------------Update Skill Bonuses------------------*/
// Watch for updates to: Attribute Modifiers, Half-Level, Trained Status, Skill Focus and Misc. Modifiers
// Use the variables: listOfSklls, and listOfAttributes
/*------------------End Skill Bonsuses------------------*/
function getSkillCalculationFields(skill) {
    return [
        "half-level",
        "capped_dex_mod",
        `${skill}_attribute`,
        `${skill}_trained`,
        `${skill}_focus`,
        `${skill}_misc`,
        `${skill}_ability`,
        "current_character_type",
        "size_penalty",
        ...listOfAttributes
    ];
}

function getSkillLinkedAttribute(value) {
    return String(value || '')
        .split("_")[0]
        .replace("@", "")
        .replace("{", "")
        .replace("}", "");
}

function calculateSkillBonus(skill, values) {
    const attribute = getSkillLinkedAttribute(values[`${skill}_ability`]);
    const halfLevel = parseInt(values["half-level"], 10) || 0;
    const trained = parseInt(values[`${skill}_trained`], 10) || 0;
    const focus = parseInt(values[`${skill}_focus`], 10) || 0;
    const misc = parseInt(values[`${skill}_misc`], 10) || 0;
    const abilityMod = parseInt(values[`${attribute}_modifier`], 10) || 0;
    const cappedDexModifier = parseInt(values["capped_dex_mod"], 10);
    const calculatedAbilityMod = attribute === "dexterity"
        ? Math.min(abilityMod, isNaN(cappedDexModifier) ? 1000 : cappedDexModifier)
        : abilityMod;
    const sizePenalty = parseInt(values["size_penalty"], 10) || 0;
    const currentCharacterType = parseInt(values["current_character_type"], 10) || 1;
    const npcStealthPenalty = currentCharacterType === 4 && skill === 'stealth' ? sizePenalty : 0;
    return halfLevel + trained + focus + misc + calculatedAbilityMod + npcStealthPenalty;
}

function recalcSkill(skill) {
    getAttrs(getSkillCalculationFields(skill), function(values) {
        const skillBonusTotal = calculateSkillBonus(skill, values);
        setAttrs({
            [`${skill}_bonus`]: skillBonusTotal
        });
    });
}

//Calculate Half-Level and Re-calculate Skills when Level changes
on('change:level change:minion_level change:monster_level', function(eventInfo) {
    getAttrs(['level', 'minion_level', 'monster_level', 'half-level'], function(values) {
        const seekerLevel = parseInt(values.level, 10) || 0;
        const minionLevel = parseInt(values.minion_level, 10) || 0;
        const monsterLevel = parseInt(values.monster_level, 10) || 0;
        const totalLevels = seekerLevel + minionLevel + monsterLevel;
        const halfLevelValue = Math.floor(totalLevels / 2);
        const previousHalfLevelValue = parseInt(values['half-level']) || 0;

        if (halfLevelValue === previousHalfLevelValue) {
            log("Level Updated", "No Change in Half-Level Value.", derivedStatsColor);
        }
        else { //Half-Level Changed updated Half-level, then realculate all skills and weapons
            const setattrs = {};
            setattrs['half-level'] = halfLevelValue;
            setAttrs(setattrs,{silent:true});
            //re-calculate all skills
            listOfSklls.forEach(async (skill) => {
                recalcSkill(skill);
            });
            updateWeaponsBabHalfLevel();
        }
    });
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
                const skillAttribute = getSkillLinkedAttribute(values[`${skill}_ability`]);
                if (skillAttribute === attributeName) {
                    recalcSkill(skill);
                }
            });
        });
    });
});

// when the size penalty changes, re-calculate stealth
on('change:size_penalty', function() {
    recalcSkill('stealth');
});
