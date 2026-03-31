
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
        switch(attScore) {
            case 3:
                modScore = -4;
                break;
            case 4:
            case 5:
                modScore = -3;
                break;
            case 6:
            case 7:
                modScore = -2;
                break;
            case 8:
            case 9:
                modScore = -1;
                break;
            case 10:
            case 11:
                modScore = 0;
                break;
            case 12:
            case 13:
                modScore = 1;
                break;
            case 14:
            case 15:
                modScore = 2;
                break;
            case 16:
            case 17:
                modScore = 3;
                break;
            case 18:
            case 19:
                modScore = 4;
                break;
            default:
                modScore = 5;
                break;
        }
        log("Modifier", modScore, derivedStatsColor)
        const attrsToSet = {};
        attrsToSet[`${attribute}_modifier`] = modScore;
        setAttrs(attrsToSet);
    });
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