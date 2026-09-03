// Word bank for "How Do You Spell Bananas?"
// Each entry: the correctly spelled word, a plain-language clue (shown to
// the player so they know what word they're assembling without being told
// its spelling), and 3 common misspellings kept for reference/reuse.
//
// Note: a handful of entries in the original list accidentally included the
// correct spelling itself as one of the "misspellings" (Existence, Guarantee,
// Immediate, Independent, Parliament, Principal) or duplicated an entry
// (Fluorescent, Possession) or referenced a garbled paste (Definite). Those
// were replaced with genuine common misspellings so every wrong tile is
// actually wrong. "Highend" was dropped (not a standard single-word term).
// "Miniscule" was retargeted to the dictionary-correct "Minuscule".

const WORD_BANK = [
  { word: "Accommodate", clue: "To provide lodging for, or to make suitable arrangements", misspellings: ["accomodate", "acommodate", "accomadate"] },
  { word: "Achieve", clue: "To successfully reach a goal through effort", misspellings: ["acheive", "achive", "achiieve"] },
  { word: "Acknowledge", clue: "To accept or admit that something is true", misspellings: ["acknowlegde", "aknowledge", "acknoledge"] },
  { word: "Acquaintance", clue: "A person you know, but who isn't a close friend", misspellings: ["aquaintance", "acquantance", "aquaintence"] },
  { word: "Aggressive", clue: "Ready to attack or confront; forceful", misspellings: ["agressive", "agresive", "aggresive"] },
  { word: "Amateur", clue: "Someone who does something for enjoyment, not as a profession", misspellings: ["amature", "amateure", "amatuer"] },
  { word: "Apparent", clue: "Clearly visible or understood; obvious", misspellings: ["aparant", "apparant", "apparrent"] },
  { word: "Argument", clue: "A disagreement, or a reason given to support an idea", misspellings: ["arguement", "argumant", "arguwment"] },
  { word: "Athlete", clue: "A person trained to compete in sports", misspellings: ["athalete", "athlite", "athmlete"] },
  { word: "Believe", clue: "To accept that something is true", misspellings: ["beleive", "belive", "beleve"] },
  { word: "Calendar", clue: "A chart showing the days, weeks, and months of a year", misspellings: ["calender", "calandar", "calander"] },
  { word: "Category", clue: "A group of things that share common features", misspellings: ["catagory", "categery", "catagery"] },
  { word: "Changeable", clue: "Likely to change; not staying the same", misspellings: ["changable", "changieble", "changible"] },
  { word: "Colleague", clue: "A person you work with", misspellings: ["collegue", "colleegue", "collague"] },
  { word: "Column", clue: "A vertical division on a page, or an upright pillar", misspellings: ["colum", "collum", "colmn"] },
  { word: "Commitment", clue: "A promise or pledge to do something", misspellings: ["commitement", "comittment", "committment"] },
  { word: "Conscious", clue: "Awake and aware of your surroundings", misspellings: ["consious", "concocious", "conscius"] },
  { word: "Controversy", clue: "Public disagreement about a matter of opinion", misspellings: ["controversey", "controvrsy", "controversay"] },
  { word: "Definite", clue: "Clearly stated or decided; certain", misspellings: ["defenite", "definate", "definit"] },
  { word: "Dilemma", clue: "A situation that forces a choice between difficult options", misspellings: ["dilema", "dilimma", "dillma"] },
  { word: "Disappear", clue: "To go out of sight; to vanish", misspellings: ["dissapear", "disapear", "dissappear"] },
  { word: "Disappoint", clue: "To fail to meet someone's hopes or expectations", misspellings: ["dissapoint", "disapoint", "dissappoint"] },
  { word: "Ecstasy", clue: "A feeling of overwhelming joy or excitement", misspellings: ["ecstacy", "ecstsay", "ecstaxey"] },
  { word: "Embarrass", clue: "To make someone feel awkward or ashamed", misspellings: ["embarass", "embaress", "embarres"] },
  { word: "Environment", clue: "The surroundings in which a person, animal, or plant lives", misspellings: ["enviroment", "enviornment", "envinroment"] },
  { word: "Exaggerate", clue: "To make something sound bigger or more extreme than it really is", misspellings: ["exagarate", "exagerate", "exxagerate"] },
  { word: "Existence", clue: "The state of being real or alive", misspellings: ["existance", "exsistence", "existense"] },
  { word: "Familiar", clue: "Well known from close or repeated contact", misspellings: ["familar", "familliar", "familear"] },
  { word: "Finally", clue: "At the end, after a long time or delay", misspellings: ["finaly", "finalli", "finnaly"] },
  { word: "Fluorescent", clue: "Giving off a bright glow when lit up or exposed to light", misspellings: ["florescent", "fluoresecent", "flourescent"] },
  { word: "Guarantee", clue: "A firm promise that something will happen or be true", misspellings: ["guarantie", "gurantee", "garantee"] },
  { word: "Harass", clue: "To repeatedly bother, disturb, or torment someone", misspellings: ["harrass", "haras", "harrasss"] },
  { word: "Hypocrite", clue: "Someone who claims beliefs or values they don't actually follow", misspellings: ["hipocrite", "hypocrit", "hippocrite"] },
  { word: "Immediate", clue: "Happening right away, without any delay", misspellings: ["immedate", "imidiate", "immediat"] },
  { word: "Incident", clue: "An event or occurrence, often minor or unplanned", misspellings: ["incindent", "inciddent", "insident"] },
  { word: "Independent", clue: "Free from outside control; not relying on others", misspellings: ["independant", "independednt", "indipendent"] },
  { word: "Interrupt", clue: "To stop something in progress by breaking in", misspellings: ["interupt", "interrupte", "interrup"] },
  { word: "Knowledge", clue: "Facts, information, and skills gained through learning or experience", misspellings: ["knowlege", "nowledge", "knowlidge"] },
  { word: "Liaison", clue: "A person who links or coordinates communication between groups", misspellings: ["liason", "liasion", "laison"] },
  { word: "Millennium", clue: "A period of one thousand years", misspellings: ["millenium", "milennium", "milenium"] },
  { word: "Minuscule", clue: "Extremely small; tiny", misspellings: ["miniscule", "minusculle", "minisqule"] },
  { word: "Noticeable", clue: "Easy to see or observe", misspellings: ["noticable", "noticible", "noticably"] },
  { word: "Occasion", clue: "A particular time, event, or celebration", misspellings: ["ocassion", "occassion", "ocasion"] },
  { word: "Occurrence", clue: "Something that happens; an event", misspellings: ["occurance", "occurence", "ocurrence"] },
  { word: "Parliament", clue: "A group of elected officials who make a country's laws", misspellings: ["parliment", "parleament", "parlament"] },
  { word: "Personnel", clue: "The people who work for an organization", misspellings: ["personel", "personell", "personnell"] },
  { word: "Possession", clue: "Something owned; the state of owning something", misspellings: ["posession", "possesion", "posesion"] },
  { word: "Prejudice", clue: "An unfair opinion about someone formed without real knowledge of them", misspellings: ["prejude", "predjudice", "prejudise"] },
  { word: "Principal", clue: "The person in charge of a school, or the most important thing", misspellings: ["principel", "principe", "prinicpal"] },
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
