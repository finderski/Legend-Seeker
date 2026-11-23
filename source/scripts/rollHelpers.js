const getDieResultValue = result => {
    if (typeof result === 'number') {
        return result;
    }
    if (!result || typeof result !== 'object') {
        return null;
    }

    const value = result.v !== undefined
        ? result.v
        : result.result !== undefined
            ? result.result
            : result.value;
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
};

const findFirstD20Result = rollParts => {
    if (!Array.isArray(rollParts)) {
        return null;
    }

    for (const rollPart of rollParts) {
        if (Array.isArray(rollPart)) {
            const nestedArrayResult = findFirstD20Result(rollPart);
            if (nestedArrayResult !== null) {
                return nestedArrayResult;
            }
            continue;
        }

        if (!rollPart || typeof rollPart !== 'object') {
            continue;
        }

        if (Number(rollPart.sides) === 20 && Array.isArray(rollPart.results)) {
            for (const result of rollPart.results) {
                const value = getDieResultValue(result);
                if (value !== null) {
                    return value;
                }
            }
        }

        const nestedRollResult = findFirstD20Result(rollPart.rolls);
        if (nestedRollResult !== null) {
            return nestedRollResult;
        }
    }

    return null;
};

const getPrimaryD20State = (rollResult, criticalThreshold = 20) => {
    const naturalRoll = findFirstD20Result(rollResult && rollResult.rolls);
    const validNaturalRoll = naturalRoll === null ? 0 : naturalRoll;

    return {
        naturalRoll: validNaturalRoll,
        criticalSuccess: validNaturalRoll >= criticalThreshold ? 1 : 0,
        criticalFailure: validNaturalRoll === 1 ? 1 : 0
    };
};

const getD20ComputedResults = (rollResult, criticalThreshold = 20) => {
    const state = getPrimaryD20State(rollResult, criticalThreshold);
    return {
        'critical-success': state.criticalSuccess,
        'critical-failure': state.criticalFailure
    };
};
