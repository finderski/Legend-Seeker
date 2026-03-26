const conditions = ['sheet:opened', 'change:characterIsNpc', 'change:speed_hasLand', 'change:speed_hasWater', 'change:speed_hasAir', 'change:speed_hasBurrow'];

conditions.forEach(condition => {
    on(`${condition}`, (eventInfo) => {
        console.log('onOpen.js triggered by condition:', condition);
        getAttrs(['characterIsNpc', 'speed_hasLand', 'speed_hasWater', 'speed_hasAir', 'speed_hasBurrow'], v => {
            const isNpc = parseInt(v.characterIsNpc, 10) || 0;
            const land = parseInt(v.speed_hasLand, 10) || 0;
            const water = parseInt(v.speed_hasWater, 10) || 0;
            const air = parseInt(v.speed_hasAir, 10) || 0;
            const burrow = parseInt(v.speed_hasBurrow, 10) || 0;

            let sumOfSpeeds = land + water + air + burrow;
            console.log('Total number of speed types:', sumOfSpeeds);
            let numOfRows = isNpc ? sumOfSpeeds : Math.ceil(sumOfSpeeds / 2);
            console.log('Number of speed rows to display:', numOfRows);
            setAttrs({
                count_of_speeds: numOfRows
            });
        });
    });
});