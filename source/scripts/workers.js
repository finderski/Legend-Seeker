
// Define colors for Logs
const r20color = '#E948C9';
const buttonClick = 'goldenrod';
const sheetinit = 'lime';
const deltaColor = 'darkgoldenrod';
const derivedStatsColor = 'Salmon';

// Better Logging Functionality
const log = (
    title,
    text,
    color = 'green',
    headerstyle = 'font-size:14px; font-weight:bold;',
    bodystyle = 'font-size:12px; font-weight:normal;'
) => {
    let titleStyle = `color:${color}; ${headerstyle} text-decoration:underline;`;
    let textStyle = `color:${color}; ${bodystyle}`;
    const output = `%c${title}:%c ${text}`;
    console.log(output, titleStyle, textStyle);
};

/* Common Functions for Workers Goes Here */

/* ensure created row ids are unique even if created in rapid succession */
const createUniqueID = row_ids => {
    row_ids = Array.ids ? row_ids : [];
    let generated;
    while (!generated || row_ids.includes(generated)) {
        generated = generateRowID();
    }
    row_ids.push(generated);
    return generated;
}

// Simple Sum function for repeating sections with check field
function repeatingSimpleSumWCheck(
    section,
    field,
    destination,
    checkfield,
    checkvalue
) {
    let repSection = 'repeating_' + section;
    getSectionIDs(repSection, function (idArray) {
        //Construct Array of fields to get attributes for...
        let sumFields = [];
        let checkFields = [];
        for (let a = 0; a < idArray.length; a++) {
            sumFields[sumFields.length] = repSection + '_' + idArray[a] + '_' + field;
            checkFields[checkFields.length] =
                repSection + '_' + idArray[a] + '_' + checkfield;
        }

        getAttrs(sumFields, function (v) {
            getAttrs(checkFields, function (c) {

                var sumTotal = 0;
                for (a = 0; a < idArray.length; a++) {
                    if (c[checkFields[a]] === checkvalue) {
                        sumTotal += parseFloat(v[sumFields[a]]) || 0;
                    }
                }
                var setSumValue = {};
                setSumValue[destination] = sumTotal;
                setAttrs(setSumValue);
            });
        });
    });
}

const checkDiceExpression = (expression) => {
    const dicePattern = /^\d+(d\d+)?([+-]\d+)?$/i;
    return dicePattern.test(expression);
}

const coreAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

coreAttributes.forEach(attribute => {
    on(`change:${attribute}`, function (eventInfo) {
        const attScore = Math.floor((parseInt(eventInfo.newValue) || 0));
        let modScore;
        modScore = attScore < 2 ? -5 :
                   attScore < 4 ? -4 :
                   attScore < 6 ? -3 :
                   attScore < 8 ? -2 :
                   attScore < 10 ? -1 :
                   attScore < 12 ? 0 :
                   attScore < 14 ? 1 :
                   attScore < 16 ? 2 :
                   attScore < 18 ? 3 :
                   attScore < 20 ? 4 :
                   attScore < 22 ? 5 :
                   attScore < 24 ? 6 :
                   attScore < 26 ? 7 :
                   attScore < 28 ? 8 :
                   attScore < 30 ? 9 : 10;
        log("Modifier", modScore, derivedStatsColor)
        const attrsToSet = {};
        attrsToSet[`${attribute}_modifier`] = modScore;
        setAttrs(attrsToSet);
    });
});

// Heroic Proficiency Bonus Calculation
on('change:level', function(eventInfo) {
    const level = parseInt(eventInfo.newValue) || 0;
    let hpb = level < 5 ? 2 : level < 9 ? 3 : level < 13 ? 4 : level < 17 ? 5 : 6;
    setAttrs({ "heroic_proficiency_bonus": hpb });
});

// Update Corruption
on('change:wisdom', function(eventInfo) {
    const wisdomScore = Math.floor((parseInt(eventInfo.newValue) || 0));
    const setattrs = {};
    for(let i=1; i <= 24; i++) {
        // while i is the less than 24, hide the lock inputs
        if (i <= wisdomScore) {
            setattrs[`corruption_lock_${i}`] = 'show';
        } else {
            setattrs[`corruption_lock_${i}`] = 'hide';
        }
    }
    setAttrs(setattrs);
});

// Watch for changes for Stamina Damage Threshold
on('change:stamina_fortdef change:stamina_miscbonus', function(eventInfo) {
    log("Threshold Watch Detected Change", eventInfo, r20color);
    getAttrs(['stamina_fortDef', 'stamina_miscBonus'], function(v) {
        const fortTotal = parseInt(v.stamina_fortDef) || 0;
        const staminaMiscBonus = parseInt(v.stamina_miscBonus) || 0;
        const staminaDamageThreshold = fortTotal + staminaMiscBonus;
        setAttrs({ "stamina_damageThreshold": staminaDamageThreshold });
    });
});

// Watch for Changes to Condition to update Styling.
on('change:condition', function(eventInfo) {
    const conditionValue = eventInfo.newValue;
    const setattrs = {};
    setattrs['condition_selected'] = conditionValue;
    setAttrs(setattrs);
});

// Watch for Fort Save Changes
on('change:level_or_armor change:fort_class_bonus change:constitution_modifier change:fort_misc_save_mod change:condition_selected', function() {
    getAttrs(['level_or_armor', 'fort_class_bonus', 'constitution_modifier', 'fort_misc_save_mod', 'condition_selected'], function(v) {
        console.log("v for Fort Save ", v);
        const condition = parseInt(v.condition_selected.split(' ')[0]||0);
        const levelOrArmor = parseInt(v.level_or_armor) || 0;
        const classBonus = parseInt(v.fort_class_bonus) || 0;
        const constitutionModifier = parseInt(v.constitution_modifier) || 0;
        const fortMiscSaveMod = parseInt(v.fort_misc_save_mod) || 0;
        log("Fort Save Calculation", `10 + ${levelOrArmor} (Level/Armor) + ${classBonus} (Class Bonus) + ${constitutionModifier} (Constitution Modifier) + ${fortMiscSaveMod} (Misc Mod) + ${condition} (Condition)`, r20color);
        const fortSaveTotal = 10+levelOrArmor + classBonus + constitutionModifier + fortMiscSaveMod + condition;
        const setattrs = {};
        setattrs['fort_total'] = fortSaveTotal;
        setattrs['stamina_fortDef'] = fortSaveTotal;
        setAttrs(setattrs);
    });
});

// Watch for Ref Save Changes
on('change:level_or_armor change:ref_class_bonus change:dexterity_modifier change:ref_misc_save_mod change:condition_selected', function() {
    getAttrs(['level_or_armor', 'ref_class_bonus', 'dexterity_modifier', 'ref_misc_save_mod', 'condition_selected'], function(v) {
        const condition = parseInt(v.condition_selected.split(' ')[0]||0);
        const levelOrArmor = parseInt(v.level_or_armor) || 0;
        const classBonus = parseInt(v.ref_class_bonus) || 0;
        const dexterityModifier = parseInt(v.dexterity_modifier) || 0;
        const refMiscSaveMod = parseInt(v.ref_misc_save_mod) || 0;

        const refSaveTotal = 10+levelOrArmor + classBonus + dexterityModifier + refMiscSaveMod + condition;
        setAttrs({ ref_total: refSaveTotal });
    });
});

// Watch for Will Save Changes
on('change:level_or_armor change:will_class_bonus change:wisdom_modifier change:will_misc_save_mod change:condition_selected', function() {
    getAttrs(['level_or_armor', 'will_class_bonus', 'wisdom_modifier', 'will_misc_save_mod', 'condition_selected'], function(v) {
        const condition = parseInt(v.condition_selected.split(' ')[0]||0);
        const levelOrArmor = parseInt(v.level_or_armor) || 0;
        const classBonus = parseInt(v.will_class_bonus) || 0;
        const wisdomModifier = parseInt(v.wisdom_modifier) || 0;
        const willMiscSaveMod = parseInt(v.will_misc_save_mod) || 0;

        const willSaveTotal = 10+levelOrArmor + classBonus + wisdomModifier + willMiscSaveMod + condition;
        setAttrs({ will_total: willSaveTotal });
    });
});