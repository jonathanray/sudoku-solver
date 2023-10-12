// @ts-check
const { existsSync, readFileSync } = require("node:fs");

const samplePath = process.argv[2] ?? "samples/easy.txt";
if (!existsSync(samplePath)) {
  console.error(`Usage: node ${__filename} <sample-path>`);
  process.exit(1);
}

/** @typedef {Cell[][]} Board */

class Cell {
  /** @type {number} */
  number;
  /** @type {string} */
  possibilities;
  /** @type {Cell[]} */
  column;
  /** @type {Cell[]} */
  row;
  /** @type {Board} */
  square;

  constructor() {
    this.possibilities = "";
  }
}

const sampleData = readFileSync(samplePath, { encoding: "utf-8" });

const lines = sampleData.trim().split(/\r?\n/);
for (let index = 0; index < lines.length; index++) {
  const board = fill(9, () => fill(9, () => new Cell()));
  populateBoard(board, lines[index]);
  solveBoard(board);
  if (isSolved(board)) {
    console.log(`SOLVED ${index + 1}`);
  } else {
    console.error("Failed to solve board!");
  }
  printBoard(board);
}
// printBoard(board);

/**
 *
 * @param {Board} board
 * @param {string} data
 */
function populateBoard(board, data) {
  let pos = 0;
  for (let index = 0; index < data.length; index++) {
    const char = data[index];
    if (char.trim().length === 0) continue;
    if (char >= "1" && char <= "9") {
      const row = Math.floor(pos / 9);
      const col = pos % 9;
      board[row][col].number = parseInt(char);
    }
    pos++;
    if (pos > 81) return;
  }
}

/**
 * @param {Board} board
 */
function printBoard(board) {
  const divider = "+-----------+----------+----------+";
  console.log(divider);
  for (let r = 0; r < board.length; r++) {
    const row = board[r];
    let line = "| ";
    if (r > 0 && r % 3 === 0) {
      console.log(divider);
    }
    for (let c = 0; c < row.length; c++) {
      const cell = board[r][c];
      if (c > 0 && c % 3 === 0) {
        line = `${line} |`;
      }
      line = `${line} ${cell.number ?? " "} `;
    }
    line = `${line} |`;
    console.log(line);
  }
  console.log(divider);
}

/**
 *
 * @param {number} length
 * @param {any} value
 * @returns {any[]}
 */
function fill(length, value) {
  const arr = Array(length).fill(undefined);
  for (let index = 0; index < length; index++) {
    arr[index] = value();
  }
  return arr;
}

/**
 * @param {Board} board
 */
function solveBoard(board) {
  setAllHints(board);
  while (iterate(board)) {
    // Nothing
  }
}

/**
 * @param {Board} board
 */
function iterate(board) {
  let updated = false;

  // Fill cells with only one possibility
  for (let rowIndex = 0; rowIndex < board.length; rowIndex++) {
    for (let colIndex = 0; colIndex < board[rowIndex].length; colIndex++) {
      const cell = board[rowIndex][colIndex];
      if (cell.number) continue;
      if (cell.possibilities.length === 1) {
        cell.number = parseInt(cell.possibilities);
        removeHints(board, rowIndex, colIndex);
        updated = true;
        console.log(`Placed ${cell.number} at ${colIndex}, ${rowIndex}`);
        continue;
      }
    }
  }

  // Fill cell if it is the only empty cell in row
  for (let rowIndex = 0; rowIndex < 9; rowIndex++) {
    const rowCells = board[rowIndex];
    const emptyCells = rowCells.filter((cell) => !cell.number);
    if (emptyCells.length === 1) {
      const cell = emptyCells[0];
      const colIndex = rowCells.indexOf(cell);
      cell.number = parseInt(cell.possibilities);
      removeHints(board, rowIndex, colIndex);
      updated = true;
      console.log(`Placed ${cell.number} at ${colIndex}, ${rowIndex}`);
    }
  }

  // Fill cell if it is the only empty cell in column
  for (let colIndex = 0; colIndex < 9; colIndex++) {
    const colCells = getColumn(board, colIndex);
    const emptyCells = colCells.filter((cell) => !cell.number);
    if (emptyCells.length === 1) {
      const cell = emptyCells[0];
      const rowIndex = colCells.indexOf(cell);
      cell.number = parseInt(cell.possibilities);
      removeHints(board, rowIndex, colIndex);
      updated = true;
      console.log(`Placed ${cell.number} at ${colIndex}, ${colIndex}`);
    }
  }

  if (updated) return updated;

  for (let sqRowIndex = 0; sqRowIndex < 3; sqRowIndex++) {
    for (let sqColIndex = 0; sqColIndex < 3; sqColIndex++) {
      const square = getSquareForCell(board, sqRowIndex * 3, sqColIndex * 3);
      const sqCells = square.flatMap((n) => n);
      for (let num = 1; num <= 9; num++) {
        const numStr = `${num}`;
        if (sqCells.some((cell) => cell.number === num)) continue;
        const matches = sqCells.filter((cell) =>
          cell.possibilities.includes(numStr)
        );
        if (matches.length === 0) continue;

        const cell = matches[0];
        if (matches.length === 1) {
          cell.number = num;
          const cellIndex = sqCells.indexOf(cell);
          const rowIndex = sqRowIndex * 3 + Math.floor(cellIndex / 3);
          const colIndex = sqColIndex * 3 + (cellIndex % 3);
          removeHints(board, rowIndex, colIndex);
          updated = true;
          console.log(`Placed ${cell.number} at ${colIndex}, ${rowIndex}`);
        } else if (matches.length > 1 && matches.length <= 3) {
          for (let rowOffset = 0; rowOffset < 3; rowOffset++) {
            const sqRowCells = square[rowOffset];
            const rowMatches = sqRowCells.filter((cell) =>
              cell.possibilities.includes(numStr)
            );
            if (rowMatches.length === matches.length) {
              const others = board[sqRowIndex * 3 + rowOffset].filter(
                (cell) => !sqRowCells.includes(cell)
              );
              removeHint(others, num);
            }
          }

          for (let colIndex = 0; colIndex < 3; colIndex++) {
            const sqColCells = getColumn(square, colIndex);
            const colMatches = sqColCells.filter((cell) =>
              cell.possibilities.includes(numStr)
            );
            if (colMatches.length === matches.length) {
              const column = getColumn(board, sqColIndex * 3 + colIndex);
              const others = column.filter(
                (cell) => !sqColCells.includes(cell)
              );
              removeHint(others, num);
            }
          }
        }
      }
    }
  }
  if (updated) return updated;

  // for (let sqRowIndex = 0; sqRowIndex < 3; sqRowIndex++) {
  //   for (let sqColIndex = 0; sqColIndex < 3; sqColIndex++) {
  //     const square = getSquareForCell(board, sqRowIndex * 3, sqColIndex * 3);
  //     for (let num = 1; num <= 9; num++) {}
  //   }
  // }

  return updated;
}

/**
 *
 * @param {Board} board
 * @returns {boolean}
 */
function isSolved(board) {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const cell = board[r][c];
      if (!cell.number) return false;
    }
  }
  return true;
}

/**
 * @param {Board} board
 */
function setAllHints(board) {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const cell = board[r][c];
      if (cell.number) continue;
      const possibilities = getAllHints(board, r, c);
      cell.possibilities = possibilities.join("");
    }
  }
}

/**
 * @param {Cell[]} cells
 * @param {number} number
 * @returns
 */
function removeHint(cells, number) {
  for (const cell of cells) {
    if (cell.number) continue;
    const index = cell.possibilities.indexOf(number.toString());
    if (index === -1) continue;
    cell.possibilities =
      cell.possibilities.substring(0, index) +
      cell.possibilities.substring(index + 1);
  }
}

/**
 *
 * @param {Board} board
 * @param {number} rowIndex
 * @param {number} colIndex
 */
function removeHints(board, rowIndex, colIndex) {
  const cell = board[rowIndex][colIndex];
  if (!cell.number) {
    debugger;
  }
  cell.possibilities = "";
  removeHint(board[rowIndex], cell.number);
  removeHint(getColumn(board, colIndex), cell.number);
  const sqCells = getSquareForCell(board, rowIndex, colIndex).flatMap((n) => n);
  removeHint(sqCells, cell.number);
}

function getColumn(board, colIndex) {
  return board.map((col) => col[colIndex]);
}

/**
 *
 * @param {Board} board
 * @param {number} rowIndex
 * @param {number} colIndex
 * @returns {Board}
 */
function getSquareForCell(board, rowIndex, colIndex) {
  const sqr = Math.floor(rowIndex / 3) * 3;
  const sqc = Math.floor(colIndex / 3) * 3;
  return [
    [board[sqr][sqc], board[sqr][sqc + 1], board[sqr][sqc + 2]],
    [board[sqr + 1][sqc], board[sqr + 1][sqc + 1], board[sqr + 1][sqc + 2]],
    [board[sqr + 2][sqc], board[sqr + 2][sqc + 1], board[sqr + 2][sqc + 2]],
  ];
  // return [
  //   [board[sqr][sqc], board[sqr + 1][sqc], board[sqr + 2][sqc]],
  //   [board[sqr][sqc + 1], board[sqr + 1][sqc + 1], board[sqr + 2][sqc + 1]],
  //   [board[sqr][sqc + 2], board[sqr + 1][sqc + 2], board[sqr + 2][sqc + 2]],
  // ];
}

/**
 *
 * @param {Board} board
 * @param {number} rowIndex
 * @param {number} colIndex
 * @returns {number[]}
 */
function getAllHints(board, rowIndex, colIndex) {
  const row = board[rowIndex];
  const col = getColumn(board, colIndex);
  const square = getSquareForCell(board, rowIndex, colIndex).flatMap(
    (cell) => cell
  );
  const allCells = [...row, ...col, ...square];
  const uniqueNumbers = allCells.reduce((uq, cell) => {
    return cell.number && !uq.includes(cell.number) ? [...uq, cell.number] : uq;
  }, []);
  // uniqueCells.sort((a, b) => a - b);

  const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return allNumbers.filter((n) => !uniqueNumbers.includes(n));
}
