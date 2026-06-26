export const initBricks = (level) => {
  const rows = 3 + level;
  const cols = 6;
  const bWidth = 45;
  const bHeight = 20;
  let result = [];
  const total = rows * cols;
  
  const getRandomUniqueIndex = (used) => {
     let idx;
     do { idx = Math.floor(Math.random() * total); } while(used.includes(idx));
     used.push(idx);
     return idx;
  };
  
  const usedIndices = [];
  const mysteryIndex = getRandomUniqueIndex(usedIndices);
  const boomIndex = getRandomUniqueIndex(usedIndices);
  const heartIndex = getRandomUniqueIndex(usedIndices);
  const speedIndex = getRandomUniqueIndex(usedIndices);
  const expandIndex = getRandomUniqueIndex(usedIndices);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.75) {
        const id = r * cols + c;
        const isSpecial = usedIndices.includes(id);
        const isArmored = Math.random() < 0.20; // 20% chance
        result.push({
          id,
          x: c * (bWidth + 5) + 5,
          y: r * (bHeight + 5) + 30,
          status: true,
          row: r,
          col: c,
          isMystery: id === mysteryIndex,
          isBoom: id === boomIndex,
          isHeart: id === heartIndex,
          isSpeed: id === speedIndex,
          isExpand: id === expandIndex,
          isArmored: isArmored && !isSpecial,
          hp: (isArmored && !isSpecial) ? 2 : 1,
        });
      }
    }
  }
  return result;
};
