// Word bank for "How Do You Spell Bananas?"
// Each entry: the correctly spelled word, plus 3 common misspellings.
// The game shows the word's audio/prompt and 4 platform tiles (1 correct + 3 wrong,
// shuffled) that the monkey must throw a banana at.
//
// Note: a handful of entries in the original list accidentally included the
// correct spelling itself as one of the "misspellings" (Existence, Guarantee,
// Immediate, Independent, Parliament, Principal) or duplicated an entry
// (Fluorescent, Possession) or referenced a garbled paste (Definite). Those
// were replaced with genuine common misspellings so every wrong tile is
// actually wrong. "Highend" was dropped (not a standard single-word term).
// "Miniscule" was retargeted to the dictionary-correct "Minuscule".

const WORD_BANK = [
  { word: "Accommodate", misspellings: ["accomodate", "acommodate", "accomadate"] },
  { word: "Achieve", misspellings: ["acheive", "achive", "achiieve"] },
  { word: "Acknowledge", misspellings: ["acknowlegde", "aknowledge", "acknoledge"] },
  { word: "Acquaintance", misspellings: ["aquaintance", "acquantance", "aquaintence"] },
  { word: "Aggressive", misspellings: ["agressive", "agresive", "aggresive"] },
  { word: "Amateur", misspellings: ["amature", "amateure", "amatuer"] },
  { word: "Apparent", misspellings: ["aparant", "apparant", "apparrent"] },
  { word: "Argument", misspellings: ["arguement", "argumant", "arguwment"] },
  { word: "Athlete", misspellings: ["athalete", "athlite", "athmlete"] },
  { word: "Believe", misspellings: ["beleive", "belive", "beleve"] },
  { word: "Calendar", misspellings: ["calender", "calandar", "calander"] },
  { word: "Category", misspellings: ["catagory", "categery", "catagery"] },
  { word: "Changeable", misspellings: ["changable", "changieble", "changible"] },
  { word: "Colleague", misspellings: ["collegue", "colleegue", "collague"] },
  { word: "Column", misspellings: ["colum", "collum", "colmn"] },
  { word: "Commitment", misspellings: ["commitement", "comittment", "committment"] },
  { word: "Conscious", misspellings: ["consious", "concocious", "conscius"] },
  { word: "Controversy", misspellings: ["controversey", "controvrsy", "controversay"] },
  { word: "Definite", misspellings: ["defenite", "definate", "definit"] },
  { word: "Dilemma", misspellings: ["dilema", "dilimma", "dillma"] },
  { word: "Disappear", misspellings: ["dissapear", "disapear", "dissappear"] },
  { word: "Disappoint", misspellings: ["dissapoint", "disapoint", "dissappoint"] },
  { word: "Ecstasy", misspellings: ["ecstacy", "ecstsay", "ecstaxey"] },
  { word: "Embarrass", misspellings: ["embarass", "embaress", "embarres"] },
  { word: "Environment", misspellings: ["enviroment", "enviornment", "envinroment"] },
  { word: "Exaggerate", misspellings: ["exagarate", "exagerate", "exxagerate"] },
  { word: "Existence", misspellings: ["existance", "exsistence", "existense"] },
  { word: "Familiar", misspellings: ["familar", "familliar", "familear"] },
  { word: "Finally", misspellings: ["finaly", "finalli", "finnaly"] },
  { word: "Fluorescent", misspellings: ["florescent", "fluoresecent", "flourescent"] },
  { word: "Guarantee", misspellings: ["guarantie", "gurantee", "garantee"] },
  { word: "Harass", misspellings: ["harrass", "haras", "harrasss"] },
  { word: "Hypocrite", misspellings: ["hipocrite", "hypocrit", "hippocrite"] },
  { word: "Immediate", misspellings: ["immedate", "imidiate", "immediat"] },
  { word: "Incident", misspellings: ["incindent", "inciddent", "insident"] },
  { word: "Independent", misspellings: ["independant", "independednt", "indipendent"] },
  { word: "Interrupt", misspellings: ["interupt", "interrupte", "interrup"] },
  { word: "Knowledge", misspellings: ["knowlege", "nowledge", "knowlidge"] },
  { word: "Liaison", misspellings: ["liason", "liasion", "laison"] },
  { word: "Millennium", misspellings: ["millenium", "milennium", "milenium"] },
  { word: "Minuscule", misspellings: ["miniscule", "minusculle", "minisqule"] },
  { word: "Noticeable", misspellings: ["noticable", "noticible", "noticably"] },
  { word: "Occasion", misspellings: ["ocassion", "occassion", "ocasion"] },
  { word: "Occurrence", misspellings: ["occurance", "occurence", "ocurrence"] },
  { word: "Parliament", misspellings: ["parliment", "parleament", "parlament"] },
  { word: "Personnel", misspellings: ["personel", "personell", "personnell"] },
  { word: "Possession", misspellings: ["posession", "possesion", "posesion"] },
  { word: "Prejudice", misspellings: ["prejude", "predjudice", "prejudise"] },
  { word: "Principal", misspellings: ["principel", "principe", "prinicpal"] },
];

// Fisher-Yates shuffle, used to randomize word order per level and
// tile order within a round.
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a shuffled deck of word rounds for a whole game session.
// Words don't repeat until the whole 49-word bank has been used once.
function buildWordDeck() {
  return shuffle(WORD_BANK);
}
