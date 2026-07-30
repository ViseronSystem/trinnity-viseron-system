import * as fs from "fs-extra";
import * as path from "path";

const MINDS_DIR = path.join(__dirname, "..", "data", "minds");

interface Mind {
  id: string; name: string; era: string; origin: string; wisdom: number;
  specialties: string[]; personality: string[]; knowledge: string[]; symbol: string;
}

const ERAS = ["primordial","ancient","classical","medieval","renaissance","industrial","modern","futuristic"];

const FAMOUS_MINDS: Mind[] = [];
let idCounter = 0;
const mid = (name: string) => `mind_${++idCounter}_${name.toLowerCase().replace(/[^a-z0-9]/g,"_").slice(0,40)}`;

function add(name: string, era: string, origin: string, wisdom: number, specs: string[], pers: string[], kn: string[], sym: string) {
  FAMOUS_MINDS.push({ id: mid(name), name, era, origin, wisdom, specialties: specs, personality: pers, knowledge: kn, symbol: sym });
}

// ANCIENT PHILOSOPHERS
add("Socrates","classical","greek",98,["questioning","dialectic","truth-seeking","ethics"],["wise","curious","ironic","humble"],["philosophy","ethics","dialectic","truth"],"❓");
add("Plato","classical","greek",97,["idealism","forms","republic","allegory-cave"],["visionary","systematic","idealistic","analytical"],["philosophy","forms","politics","metaphysics"],"🏛️");
add("Aristotle","classical","greek",98,["logic","ethics","science","metaphysics"],["systematic","empirical","comprehensive","rational"],["philosophy","logic","ethics","science"],"📐");
add("Pythagoras","classical","greek",90,["mathematics","harmony","numbers","music-spheres"],["mystical","mathematical","disciplined","secretive"],["mathematics","harmony","numbers","mysticism"],"🔢");
add("Euclid","classical","greek",92,["geometry","elements","proof","axioms"],["precise","systematic","foundational","patient"],["geometry","mathematics","proof","axioms"],"📐");
add("Archimedes","classical","greek",93,["physics","engineering","buoyancy","levers"],["brilliant","practical","inventive","focused"],["physics","engineering","mathematics","invention"],"🔧");
add("Hippocrates","classical","greek",88,["medicine","hippocratic-oath","diagnosis","ethics"],["observant","ethical","compassionate","methodical"],["medicine","ethics","diagnosis","healing"],"⚕️");
add("Diogenes","classical","greek",80,["cynicism","simplicity","truth-telling","self-sufficiency"],["unconventional","sharp","ascetic","provocative"],["philosophy","cynicism","simplicity","truth"],"🐕");
add("Epicurus","classical","greek",85,["epicureanism","pleasure","ataraxia","friendship"],["gentle","wise","pleasure-seeking","tranquil"],["philosophy","epicureanism","pleasure","tranquility"],"🍇");
add("Zeno Citium","classical","greek",87,["stoicism","virtue","reason","nature"],["disciplined","rational","wise","resilient"],["philosophy","stoicism","virtue","nature"],"🏛️");
add("Heraclitus","classical","greek",86,["change","flux","logos","opposites"],["mysterious","profound","obscure","dynamic"],["philosophy","change","flux","unity"],"🔥");
add("Parmenides","classical","greek",85,["being","monism","truth","permanence"],["logical","rigid","foundational","abstract"],["philosophy","being","monism","truth"],"◀️");
add("Democritus","classical","greek",88,["atomism","materialism","ethics","cosmology"],["rational","curious","foundational","systematic"],["philosophy","atoms","materialism","cosmology"],"⚛️");
add("Thales","classical","greek",82,["water-arch","naturalism","prediction","first-philosopher"],["curious","observant","bold","foundational"],["philosophy","science","water","cosmology"],"💧");
add("Anaxagoras","classical","greek",80,["nous","cosmic-mind","seeds","cosmology"],["rational","visionary","scientific","cosmic"],["philosophy","mind","cosmology","science"],"🧠");
add("Empedocles","classical","greek",78,["four-elements","love-strife","reincarnation","cosmic-cycle"],["mystical","poetic","scientific","visionary"],["philosophy","elements","love","cosmos"],"🔥");
add("Plotinus","classical","greek",92,["neoplatonism","the-one","emanation","mysticism"],["mystical","transcendent","systematic","profound"],["philosophy","neoplatonism","one","mysticism"],"☀️");
add("Protagoras","classical","greek",76,["sophism","man-measure","relativism","rhetoric"],["clever","relativistic","persuasive","humanistic"],["philosophy","relativism","rhetoric","humanism"],"📝");
add("Gorgias","classical","greek",74,["rhetoric","persuasion","nihilism","sophism"],["eloquent","persuasive","skeptical","artful"],["philosophy","rhetoric","persuasion","nihilism"],"🗣️");
add("Aristophanes","classical","greek",75,["comedy","satire","drama","social-critique"],["witty","satirical","creative","bold"],["literature","comedy","satire","drama"],"🎭");
add("Sophocles","classical","greek",85,["tragedy","oedipus","antigone","drama"],["profound","tragic","wise","artful"],["literature","tragedy","drama","fate"],"🎭");
add("Euripides","classical","greek",82,["tragedy","psychology","medea","bacchae"],["psychological","innovative","compassionate","critical"],["literature","tragedy","psychology","drama"],"🎭");
add("Aeschylus","classical","greek",80,["tragedy","oresteia","justice","drama"],["epic","just","religious","foundational"],["literature","tragedy","justice","drama"],"🎭");
add("Herodotus","classical","greek",78,["history","histories","inquiry","ethnography"],["curious","narrative","comprehensive","humanistic"],["history","ethnography","inquiry","culture"],"📖");
add("Thucydides","classical","greek",88,["history","peloponnesian","analysis","power"],["analytical","objective","precise","realistic"],["history","politics","war","analysis"],"📜");
add("Xenophon","classical","greek",76,["history","military","socrates","anabasis"],["practical","observant","versatile","writer"],["history","military","philosophy","writing"],"⚔️");
add("Ptolemy","classical","greek",85,["astronomy","geography","almagest","geocentrism"],["systematic","comprehensive","influential","scholarly"],["astronomy","geography","mathematics","science"],"🌍");
add("Galen","classical","roman",88,["medicine","anatomy","physiology","surgery"],["brilliant","comprehensive","dogmatic","influential"],["medicine","anatomy","physiology","surgery"],"💊");

// ANCIENT CHINESE
add("Sun Tzu","ancient","chinese",96,["strategy","warfare","leadership","tactics"],["strategic","wise","disciplined","analytical"],["strategy","warfare","leadership","tactics"],"⚔️");
add("Laozi","ancient","chinese",98,["taoism","wu-wei","nature","spontaneity"],["mysterious","profound","simple","wise"],["philosophy","taoism","nature","spontaneity"],"☯️");
add("Zhuangzi","ancient","chinese",94,["taoism","relativism","dream","butterfly"],["playful","profound","skeptical","imaginative"],["philosophy","taoism","relativism","dream"],"🦋");
add("Mencius","ancient","chinese",90,["confucianism","human-nature","benevolence","righteousness"],["wise","compassionate","ethical","scholarly"],["philosophy","ethics","human-nature","confucianism"],"📚");
add("Xunzi","ancient","chinese",86,["confucianism","ritual","education","human-nature"],["pragmatic","systematic","disciplined","realistic"],["philosophy","confucianism","ritual","education"],"🎓");
add("Mozi","ancient","chinese",84,["universal-love","meritocracy","pragmatism","logic"],["ethical","universal","practical","logical"],["philosophy","universal-love","pragmatism","logic"],"💚");
add("Han Fei","ancient","chinese",82,["legalism","law","power","governance"],["pragmatic","authoritarian","systematic","realistic"],["philosophy","legalism","law","governance"],"⚖️");
add("Shang Yang","ancient","chinese",78,["legalism","reform","agriculture","war"],["reformist","ruthless","systematic","pragmatic"],["philosophy","legalism","reform","governance"],"🏛️");

// ROMAN
add("Cicero","classical","roman",90,["oratory","philosophy","republic","law"],["eloquent","wise","constitutional","passionate"],["rhetoric","philosophy","law","politics"],"🗣️");
add("Seneca","classical","roman",92,["stoicism","ethics","tragedy","advisory"],["wise","calm","reflective","resilient"],["philosophy","stoicism","ethics","tragedy"],"📝");
add("Marcus Aurelius","classical","roman",94,["stoicism","meditations","leadership","duty"],["wise","reflective","dutiful","philosophical"],["philosophy","stoicism","meditations","leadership"],"👑");
add("Epictetus","classical","roman",90,["stoicism","freedom","control","dichotomy"],["wise","practical","resilient","liberating"],["philosophy","stoicism","freedom","control"],"🕊️");
add("Lucretius","classical","roman",85,["epicureanism","nature-of-things","atomism","poetry"],["poetic","scientific","philosophical","enlightened"],["philosophy","epicureanism","poetry","science"],"📜");
add("Virgil","classical","roman",82,["aeneid","epic","poetry","roman-glory"],["epic","patriotic","poetic","masterful"],["literature","epic","poetry","rome"],"📖");
add("Ovid","classical","roman",78,["metamorphoses","poetry","love","mythology"],["creative","playful","passionate","transformative"],["literature","poetry","mythology","love"],"📖");
add("Tacitus","classical","roman",84,["history","annals","germania","critique"],["analytical","critical","precise","unflinching"],["history","politics","critique","germany"],"📜");
add("Pliny Elder","classical","roman",80,["natural-history","encyclopedia","science","observation"],["curious","comprehensive","observant","scholarly"],["science","natural-history","encyclopedia","observation"],"📚");
add("Pliny Younger","classical","roman",74,["letters","vesuvius","governance","writing"],["observant","detailed","humanistic","correspondent"],["literature","letters","governance","history"],"✉️");

// MEDIEVAL
add("Augustine","medieval","theologian",96,["theology","confessions","city-god","grace"],["passionate","intellectual","profound","converted"],["theology","philosophy","grace","confessions"],"✝️");
add("Thomas Aquinas","medieval","theologian",97,["scholasticism","summa","theology","reason"],["systematic","brilliant","scholarly","faithful"],["theology","philosophy","reason","ethics"],"📚");
add("Anselm","medieval","theologian",86,["ontological-argument","faith-seeking","theology","reason"],["rational","faithful","bold","philosophical"],["theology","philosophy","reason","faith"],"🤔");
add("Abelard","medieval","philosopher",85,["logic","ethics","sic-et-non","dialectic"],["brilliant","controversial","logical","romantic"],["logic","philosophy","ethics","dialectic"],"⚔️");
add("Heloise","medieval","scholar",82,["letters","scholarship","philosophy","love"],["brilliant","passionate","learned","tragic"],["philosophy","letters","scholarship","love"],"💌");
add("Rumi","medieval","poet",96,["poetry","sufism","love","mysticism"],["ecstatic","loving","wise","divine"],["poetry","mysticism","love","spirituality"],"💃");
add("Al-Khwarizmi","medieval","mathematician",94,["algebra","algorithms","numerals","mathematics"],["brilliant","foundational","systematic","innovative"],["mathematics","algebra","algorithms","numerals"],"🧮");
add("Avicenna","medieval","polymath",97,["medicine","philosophy","canon","logic"],["brilliant","comprehensive","systematic","polymath"],["medicine","philosophy","science","logic"],"💊");
add("Averroes","medieval","philosopher",93,["aristotle-commentary","philosophy","law","reason"],["rational","scholarly","influential","wise"],["philosophy","law","aristotle","reason"],"📚");
add("Al-Ghazali","medieval","theologian",94,["theology","mysticism","sufism","philosophy-critique"],["spiritual","intellectual","devout","skeptical"],["theology","mysticism","sufism","philosophy"],"☪️");
add("Al-Farabi","medieval","philosopher",91,["philosophy","music","logic","perfect-city"],["wise","systematic","harmonious","comprehensive"],["philosophy","music","logic","politics"],"🎵");
add("Ibn Battuta","medieval","explorer",78,["travel","exploration","geography","cultures"],["curious","observant","adventurous","persistent"],["travel","exploration","geography","cultures"],"🗺️");
add("Al-Biruni","medieval","scholar",93,["astronomy","mathematics","anthropology","science"],["brilliant","curious","systematic","objective"],["science","astronomy","anthropology","mathematics"],"🔭");
add("Omar Khayyam","medieval","polymath",88,["poetry","mathematics","astronomy","rubaiyat"],["poetic","mathematical","philosophical","hedonistic"],["poetry","mathematics","astronomy","philosophy"],"🌹");
add("Averroes","medieval","philosopher",92,["commentary","aristotle","islamic-philosophy","reason"],["rational","faithful","scholarly","influential"],["philosophy","aristotle","reason","islam"],"📚");
add("Ibn Khaldun","medieval","historian",95,["historiography","sociology","asabiyyah","civilization"],["analytical","pioneering","systematic","scientific"],["history","sociology","civilization","science"],"📜");
add("Maimonides","medieval","philosopher",95,["jewish-philosophy","guide-perplexed","medicine","law"],["rational","comprehensive","wise","systematic"],["philosophy","medicine","law","theology"],"✡️");
add("Roger Bacon","medieval","philosopher",84,["empiricism","science","optica","experimental"],["curious","empirical","pioneering","scientific"],["science","empiricism","optics","experiment"],"🔬");
add("William Occam","medieval","philosopher",86,["occams-razor","nominalism","logic","simplicity"],["logical","simple","sharp","nominalist"],["philosophy","logic","nominalism","simplicity"],"🪒");
add("Duns Scotus","medieval","philosopher",84,["scholasticism","subtle-doctor","being","metaphysics"],["subtle","precise","complex","scholarly"],["philosophy","metaphysics","being","theology"],"📚");
add("Joan Arc","medieval","military-leader",72,["faith","warfare","leadership","martyrdom"],["faithful","courageous","young","inspired"],["faith","warfare","leadership","martyrdom"],"⚔️");

// RENAISSANCE
add("Da Vinci","renaissance","polymath",99,["art","anatomy","engineering","invention"],["curious","genius","visionary","polymath"],["art","anatomy","engineering","science"],"🎨");
add("Michelangelo","renaissance","artist",95,["sculpture","painting","sistine","architecture"],["passionate","perfectionist","intense","divine"],["art","sculpture","painting","anatomy"],"🗿");
add("Raphael","renaissance","artist",92,["frescoes","madonnas","composition","harmony"],["graceful","harmonious","brilliant","serene"],["art","painting","fresco","composition"],"🖼️");
add("Donatello","renaissance","artist",86,["sculpture","perspective","humanism","bronze"],["innovative","humanistic","skilled","foundational"],["art","sculpture","perspective","humanism"],"🗿");
add("Botticelli","renaissance","artist",84,["painting","mythology","venus","beauty"],["poetic","beautiful","mythological","graceful"],["art","painting","mythology","beauty"],"🌅");
add("Titian","renaissance","artist",86,["painting","color","venetian","portraiture"],["masterful","colorful","innovative","sensual"],["art","painting","color","portraiture"],"🎨");
add("Caravaggio","renaissance","artist",85,["painting","chiaroscuro","realism","drama"],["intense","dramatic","realistic","revolutionary"],["art","painting","chiaroscuro","realism"],"💡");
add("Gutenberg","renaissance","inventor",92,["printing-press","movable-type","publishing","revolution"],["inventive","persistent","revolutionary","practical"],["printing","invention","communication","revolution"],"📰");
add("Copernicus","renaissance","astronomer",93,["heliocentrism","astronomy","cosmology","revolution"],["revolutionary","brilliant","bold","methodical"],["astronomy","cosmology","heliocentrism","mathematics"],"☀️");
add("Galileo","renaissance","scientist",95,["astronomy","physics","telescope","empiricism"],["curious","bold","persistent","truth-seeker"],["astronomy","physics","empiricism","experiment"],"🔭");
add("Kepler","renaissance","astronomer",92,["planetary-motion","orbits","astronomy","mathematics"],["brilliant","patient","mathematical","mystical"],["astronomy","orbits","mathematics","physics"],"🌌");
add("Vesalius","renaissance","anatomist",90,["anatomy","fabrica","dissection","surgery"],["meticulous","pioneering","observant","revolutionary"],["anatomy","medicine","surgery","biology"],"🩻");
add("Harvey","renaissance","physician",88,["circulation","heart","blood","physiology"],["observant","experimental","pioneering","methodical"],["medicine","circulation","heart","physiology"],"❤️");
add("Erasmus","renaissance","humanist",91,["humanism","scholarship","praise-folly","education"],["witty","learned","critical","wise"],["humanism","scholarship","philosophy","education"],"📖");
add("Thomas More","renaissance","statesman",85,["utopia","statesmanship","humanism","integrity"],["principled","visionary","just","martyred"],["politics","utopia","philosophy","integrity"],"🏝️");
add("Machiavelli","renaissance","philosopher",90,["prince","political-philosophy","strategy","power"],["pragmatic","analytical","realistic","controversial"],["politics","philosophy","strategy","power"],"👁️");
add("Cervantes","renaissance","writer",92,["don-quixote","novel","satire","narrative"],["imaginative","witty","insightful","humanistic"],["literature","novel","satire","human-nature"],"📚");
add("Shakespeare","renaissance","playwright",97,["drama","poetry","hamlet","human-nature"],["insightful","creative","profound","universal"],["drama","poetry","literature","human-nature"],"🎭");
add("Marlowe","renaissance","playwright",82,["drama","faustus","blank-verse","tragedy"],["passionate","bold","tragic","creative"],["literature","drama","poetry","tragedy"],"🎭");
add("Spinoza","renaissance","philosopher",96,["ethics","pantheism","substance","freedom"],["rational","calm","revolutionary","profound"],["philosophy","ethics","pantheism","freedom"],"💎");
add("Hobbes","renaissance","philosopher",88,["leviathan","social-contract","sovereignty","materialism"],["realistic","systematic","materialistic","authoritarian"],["philosophy","politics","social-contract","materialism"],"🐉");
add("Bacon Francis","renaissance","philosopher",90,["scientific-method","empiricism","novum-organum","idols"],["empirical","systematic","pioneering","ambitious"],["science","philosophy","method","empiricism"],"🔬");
add("Descartes","renaissance","philosopher",95,["cogito","rationalism","method","mind-body"],["methodical","doubtful","rational","foundational"],["philosophy","mathematics","cogito","mind"],"🤔");
add("Leibniz","renaissance","polymath",96,["calculus","monads","binary","theodicy"],["brilliant","optimistic","systematic","polymath"],["mathematics","philosophy","calculus","logic"],"∫");
add("Pascal","renaissance","mathematician",93,["probability","pascal-triangle","pascal-wager","philosophy"],["brilliant","religious","inventive","deep"],["mathematics","probability","philosophy","physics"],"🔺");
add("Huygens","renaissance","scientist",88,["pendulum","light-wave","saturn-rings","probability"],["brilliant","experimental","theoretical","innovative"],["physics","mathematics","astronomy","optics"],"⏱️");
add("Brahe","renaissance","astronomer",78,["observations","tycho-system","supernova","uraniborg"],["observant","passionate","eccentric","aristocratic"],["astronomy","observation","stars","nobility"],"🔭");
add("Camoes","renaissance","poet",88,["os-lusiadas","epic","portugal","exploration"],["epic","adventurous","patriotic","passionate"],["poetry","epic","exploration","portugal"],"📜");

// INDUSTRIAL REVOLUTION
add("Newton","industrial","scientist",99,["gravity","calculus","optics","mechanics"],["analytical","methodical","brilliant","dedicated"],["physics","mathematics","optics","mechanics"],"🍎");
add("Leibniz","industrial","mathematician",96,["calculus","binary","logic","metaphysics"],["brilliant","polymath","systematic","optimistic"],["mathematics","calculus","logic","philosophy"],"∫");
add("Linnaeus","industrial","biologist",88,["taxonomy","classification","botany","nomenclature"],["systematic","organized","comprehensive","observant"],["biology","taxonomy","botany","classification"],"🌿");
add("Buffon","industrial","naturalist",86,["natural-history","earth-history","species","biology"],["comprehensive","visionary","scientific","elegant"],["biology","natural-history","earth","species"],"📚");
add("Lavoisier","industrial","chemist",90,["chemistry","oxygen","elements","conservation"],["systematic","precise","revolutionary","methodical"],["chemistry","elements","oxidation","conservation"],"⚗️");
add("Dalton","industrial","chemist",84,["atomic-theory","elements","color-blindness","chemistry"],["methodical","observant","modest","pioneering"],["chemistry","atoms","elements","physics"],"⚛️");
add("Mendeleev","industrial","chemist",93,["periodic-table","elements","prediction","chemistry"],["brilliant","visionary","systematic","eccentric"],["chemistry","periodic-table","elements","science"],"🧪");
add("Faraday","industrial","scientist",92,["electromagnetism","induction","chemistry","field-theory"],["curious","humble","experimental","brilliant"],["physics","electromagnetism","chemistry","fields"],"🧲");
add("Maxwell","industrial","physicist",97,["maxwell-equations","electromagnetism","thermodynamics","color"],["brilliant","unifying","mathematical","profound"],["physics","electromagnetism","mathematics","light"],"∇");
add("Boltzmann","industrial","physicist",91,["statistical-mechanics","entropy","thermodynamics","atoms"],["brilliant","passionate","determined","tragic"],["physics","thermodynamics","statistics","entropy"],"🔀");
add("Joule","industrial","physicist",82,["thermodynamics","energy","heat","experiment"],["meticulous","patient","experimental","precise"],["physics","thermodynamics","energy","heat"],"🔥");
add("Carnot","industrial","physicist",88,["thermodynamics","carnot-cycle","engines","efficiency"],["theoretical","brilliant","foundational","engineering"],["physics","thermodynamics","engineering","efficiency"],"⚙️");
add("Watt","industrial","engineer",86,["steam-engine","improvement","efficiency","revolution"],["inventive","practical","persistent","improver"],["engineering","steam","mechanics","innovation"],"⚙️");
add("Stephenson","industrial","engineer",78,["railways","locomotive","engineering","transport"],["practical","innovative","determined","pioneering"],["engineering","railways","steam","transport"],"🚂");
add("Franklin Benjamin","industrial","polymath",92,["electricity","invention","diplomacy","publishing"],["curious","practical","witty","statesman"],["electricity","invention","diplomacy","science"],"⚡");
add("Kant","industrial","philosopher",98,["categorical-imperative","critique","ethics","metaphysics"],["rigorous","systematic","methodical","profound"],["philosophy","ethics","metaphysics","epistemology"],"⚖️");
add("Hegel","industrial","philosopher",96,["dialectic","phenomenology","absolute-spirit","history"],["systematic","abstract","profound","complex"],["philosophy","dialectic","history","mind"],"🔄");
add("Schopenhauer","industrial","philosopher",92,["will","representation","pessimism","aesthetics"],["pessimistic","brilliant","solitary","deep"],["philosophy","will","aesthetics","pessimism"],"🌑");
add("Adam Smith","industrial","economist",92,["wealth-nations","invisible-hand","markets","capitalism"],["observant","analytical","systematic","moral"],["economics","capitalism","markets","philosophy"],"📊");
add("Ricardo","industrial","economist",86,["comparative-advantage","rent","labor","economics"],["analytical","systematic","theoretical","clear"],["economics","trade","rent","value"],"📈");
add("Marx","industrial","philosopher",89,["das-kapital","communism","class-struggle","dialectical-materialism"],["passionate","analytical","revolutionary","systematic"],["economics","philosophy","society","revolution"],"🚩");
add("Darwin","industrial","scientist",96,["evolution","natural-selection","origin-species","biology"],["observant","patient","methodical","groundbreaking"],["biology","evolution","natural-selection","genetics"],"🧬");
add("Wallace","industrial","naturalist",86,["evolution","natural-selection","biogeography","amazon"],["observant","brilliant","humble","adventurous"],["biology","evolution","biogeography","nature"],"🌴");
add("Pasteur","industrial","scientist",92,["microbiology","vaccination","pasteurization","germ-theory"],["meticulous","brilliant","persistent","humanitarian"],["microbiology","medicine","chemistry","science"],"🔬");
add("Mendel","industrial","scientist",86,["genetics","inheritance","pea-experiments","biology"],["patient","methodical","observant","monastic"],["genetics","inheritance","biology","botany"],"🧬");
add("Koch","industrial","physician",84,["bacteriology","tuberculosis","postulates","microbiology"],["systematic","precise","pioneering","determined"],["medicine","bacteriology","tuberculosis","science"],"🔬");
add("Beethoven","industrial","composer",97,["symphony","piano","sonata","romantic"],["passionate","defiant","genius","tragic"],["music","composition","piano","symphony"],"🎹");
add("Mozart","industrial","composer",96,["music","opera","symphony","melody"],["genius","playful","prolific","passionate"],["music","composition","opera","symphony"],"🎵");
add("Bach","industrial","composer",97,["fugue","counterpoint","baroque","organ"],["disciplined","genius","spiritual","mathematical"],["music","counterpoint","composition","organ"],"🎶");
add("Schubert","industrial","composer",86,["lieder","symphony","piano","romantic"],["lyrical","passionate","prolific","tragic"],["music","lieder","symphony","piano"],"🎵");
add("Chopin","industrial","composer",90,["piano","nocturne","polonaise","etude"],["poetic","delicate","passionate","melancholic"],["music","piano","composition","romantic"],"🎹");
add("Wagner","industrial","composer",89,["opera","leitmotif","ring","german-romantic"],["ambitious","brilliant","visionary","controversial"],["music","opera","composition","drama"],"🎭");
add("Verdi","industrial","composer",86,["opera","la-traviata","requiem","italian"],["passionate","dramatic","melodic","patriotic"],["music","opera","composition","italian"],"🎶");
add("Tchaikovsky","industrial","composer",88,["ballet","symphony","russian","romantic"],["emotional","brilliant","sensitive","passionate"],["music","ballet","symphony","russian"],"🩰");
add("Brahms","industrial","composer",90,["symphony","chamber","german","romantic"],["serious","disciplined","masterful","perfectionist"],["music","symphony","chamber","composition"],"🎵");
add("Gauss","industrial","mathematician",99,["number-theory","statistics","algebra","analysis"],["brilliant","pioneering","methodical","genius"],["mathematics","statistics","number-theory","analysis"],"∑");
add("Euler","industrial","mathematician",99,["analysis","graph-theory","eulers-identity","mechanics"],["brilliant","prolific","intuitive","masterful"],["mathematics","analysis","graph-theory","number-theory"],"π");
add("Riemann","industrial","mathematician",98,["riemann-hypothesis","geometry","analysis","zeta"],["brilliant","deep","visionary","shy"],["mathematics","riemann-hypothesis","geometry","analysis"],"ζ");
add("Poincare","industrial","mathematician",96,["topology","dynamical-systems","relativity","mathematics"],["brilliant","intuitive","comprehensive","creative"],["mathematics","topology","physics","dynamical-systems"],"🌀");
add("Galois","industrial","mathematician",92,["group-theory","algebra","equations","revolutionary"],["brilliant","passionate","revolutionary","tragic"],["mathematics","algebra","group-theory","equations"],"💥");
add("Abel","industrial","mathematician",90,["abelian","equations","elliptic","analysis"],["brilliant","original","tragic","persistent"],["mathematics","algebra","analysis","equations"],"📐");
add("Boole","industrial","mathematician",90,["boolean-algebra","logic","algebra","computation"],["logical","systematic","foundational","self-taught"],["mathematics","logic","algebra","computation"],"🔢");
add("Lobachevsky","industrial","mathematician",88,["non-euclidean-geometry","hyperbolic","revolutionary","mathematics"],["bold","revolutionary","imaginative","persistent"],["mathematics","geometry","non-euclidean","hyperbolic"],"📐");
add("Bolyai","industrial","mathematician",84,["non-euclidean-geometry","absolute","mathematics"],["brilliant","passionate","tragic","innovative"],["mathematics","geometry","non-euclidean","absolute"],"📐");
add("Nightingale","industrial","statistician",86,["nursing","statistics","healthcare","sanitation"],["compassionate","determined","reformer","mathematical"],["nursing","statistics","healthcare","reform"],"🏥");
add("Tubman","industrial","activist",88,["underground-railroad","freedom","courage","slavery-abolition"],["courageous","determined","selfless","liberator"],["freedom","courage","abolition","human-rights"],"🚂");

// MODERN SCIENTISTS
add("Einstein","modern","physicist",100,["relativity","quantum","photoelectric","cosmology"],["brilliant","curious","imaginative","humanitarian"],["physics","relativity","quantum","cosmology"],"E=mc²");
add("Planck","modern","physicist",93,["quantum-theory","blackbody","constant","physics"],["methodical","revolutionary","brilliant","persistent"],["physics","quantum","thermodynamics","radiation"],"h");
add("Bohr","modern","physicist",94,["atomic-structure","complementarity","copenhagen","quantum"],["insightful","collaborative","deep","philosophical"],["physics","quantum","atomic","philosophy"],"⚛️");
add("Heisenberg","modern","physicist",92,["uncertainty","matrix-mechanics","quantum","nuclear"],["brilliant","philosophical","complex","uncertain"],["physics","quantum","uncertainty","philosophy"],"Δ");
add("Schrodinger","modern","physicist",91,["wave-equation","cat","quantum","biology"],["brilliant","iconoclastic","broad","visionary"],["physics","quantum","wave-mechanics","biology"],"🐱");
add("Dirac","modern","physicist",96,["dirac-equation","antimatter","quantum","beauty"],["brilliant","precise","laconic","aesthetic"],["physics","quantum","antimatter","mathematics"],"⎔");
add("Pauli","modern","physicist",92,["exclusion-principle","spin","quantum","physics"],["brilliant","critical","precise","acerbic"],["physics","quantum","exclusion","spin"],"🔄");
add("Fermi","modern","physicist",93,["nuclear-reactor","fermi-paradox","statistics","physics"],["practical","brilliant","comprehensive","curious"],["physics","nuclear","statistics","paradox"],"☢️");
add("Oppenheimer","modern","physicist",89,["nuclear-physics","manhattan-project","leadership","remorse"],["brilliant","complex","tragic","visionary"],["physics","nuclear","leadership","ethics"],"☢️");
add("Feynman","modern","physicist",97,["qed","diagrams","quantum","teaching"],["charismatic","brilliant","playful","curious"],["physics","qed","quantum","teaching"],"🔬");
add("Gell-Mann","modern","physicist",91,["quarks","elementary-particles","quantum","complexity"],["brilliant","eclectic","curious","linguistic"],["physics","quarks","particles","complexity"],"🔵");
add("Rutherford","modern","physicist",89,["atomic-nucleus","gold-foil","radioactivity","physics"],["practical","brilliant","hands-on","surprising"],["physics","atomic","radioactivity","nucleus"],"🔬");
add("Chadwick","modern","physicist",82,["neutron","nuclear","physics","discovery"],["meticulous","persistent","brilliant","discoverer"],["physics","neutron","nuclear","discovery"],"⚛️");
add("Hubble","modern","astronomer",90,["expanding-universe","galaxies","hubble-constant","cosmology"],["observant","pioneering","determined","visionary"],["astronomy","cosmology","galaxies","expanding-universe"],"🔭");
add("Sagan","modern","astronomer",95,["cosmos","popular-science","exobiology","critical-thinking"],["curious","eloquent","inspirational","skeptical"],["astronomy","cosmos","science","exobiology"],"🌌");
add("Hawking","modern","physicist",95,["black-holes","hawking-radiation","cosmology","popular-science"],["brilliant","determined","witty","inspirational"],["cosmology","black-holes","physics","popular-science"],"🌌");
add("Penrose","modern","physicist",93,["twistor-theory","cosmic-censorship","consciousness","geometry"],["brilliant","iconoclastic","deep","mathematical"],["physics","mathematics","cosmology","consciousness"],"🌀");
add("Wheeler","modern","physicist",90,["black-holes","quantum-gravity","participatory-universe","geometrodynamics"],["visionary","provocative","mentor","deep"],["physics","quantum","gravity","cosmology"],"🌀");
add("Curie","modern","scientist",95,["radioactivity","polonium","radium","nobel-twice"],["dedicated","brilliant","perseverant","pioneering"],["physics","chemistry","radioactivity","nobel"],"☢️");
add("Rontgen","modern","physicist",84,["x-rays","discovery","physics","radiology"],["meticulous","observant","accidental","brilliant"],["physics","x-rays","radiology","discovery"],"🔬");
add("Becquerel","modern","physicist",80,["radioactivity","discovery","uranium","physics"],["observant","passive","accidental","pioneering"],["physics","radioactivity","uranium","discovery"],"☢️");
add("Lorentz","modern","physicist",90,["lorentz-transformation","electrodynamics","relativity","physics"],["brilliant","mathematical","foundational","theoretical"],["physics","electrodynamics","relativity","mathematics"],"∇");
add("Minkowski","modern","mathematician",88,["spacetime","geometry","relativity","mathematics"],["brilliant","geometric","visionary","teacher"],["mathematics","geometry","spacetime","relativity"],"📐");

// MODERN BIOLOGISTS & MEDICINE
add("Darwin Charles","modern","biologist",97,["evolution","natural-selection","descent","biology"],["observant","patient","methodical","groundbreaking"],["biology","evolution","natural-selection","genetics"],"🧬");
add("Mendel Gregor","modern","geneticist",86,["genetics","inheritance","pea","biology"],["patient","methodical","observant","monastic"],["genetics","inheritance","biology","experiment"],"🧬");
add("Watson Crick","modern","biologists",88,["dna","double-helix","genetics","discovery"],["ambitious","collaborative","brilliant","discoverers"],["dna","genetics","biology","molecular"],"🧬");
add("Franklin Rosalind","modern","scientist",89,["dna","xray-crystallography","photo-51","biology"],["brilliant","meticulous","perseverant","uncredited"],["dna","crystallography","biology","chemistry"],"🧬");
add("Crick","modern","biologist",90,["dna","consciousness","central-dogma","biology"],["brilliant","bold","broad","visionary"],["dna","biology","consciousness","genetics"],"🧬");
add("Monod","modern","biologist",86,["molecular-biology","operon","chance","necessity"],["brilliant","philosophical","elegant","existential"],["biology","molecular","genetics","philosophy"],"🧬");
add("Jacob Francois","modern","biologist",84,["operon","molecular-biology","gene-regulation","nobel"],["brilliant","collaborative","elegant","scientific"],["biology","molecular","genetics","operon"],"🧬");
add("Krebs","modern","biochemist",82,["krebs-cycle","metabolism","biochemistry","medicine"],["meticulous","persistent","brilliant","discoverer"],["biochemistry","metabolism","medicine","biology"],"⚗️");
add("Fleming","modern","microbiologist",80,["penicillin","antibiotics","discovery","accidental"],["observant","accidental","pioneering","humble"],["microbiology","medicine","antibiotics","discovery"],"💊");
add("Lister","modern","surgeon",82,["antisepsis","surgery","infection","medicine"],["meticulous","pioneering","careful","reformer"],["medicine","surgery","antisepsis","infection"],"🏥");
add("Freud","modern","psychologist",88,["psychoanalysis","unconscious","dreams","id-ego-superego"],["brilliant","controversial","persistent","probing"],["psychology","unconscious","dreams","psychoanalysis"],"🛋️");
add("Jung","modern","psychologist",94,["archetypes","unconscious","individuation","synchronicity"],["deep","mystical","wise","integrative"],["psychology","archetypes","unconscious","individuation"],"🔥");
add("Pavlov","modern","psychologist",80,["conditioning","reflexes","behavior","psychology"],["methodical","pioneering","observant","systematic"],["psychology","conditioning","reflexes","behavior"],"🔔");
add("Skinner","modern","psychologist",78,["behaviorism","operant-conditioning","reinforcement","psychology"],["systematic","controversial","rigorous","experimental"],["psychology","behaviorism","conditioning","learning"],"🕹️");
add("Piaget","modern","psychologist",91,["child-development","cognitive-stages","epistemology","psychology"],["observant","systematic","patient","insightful"],["psychology","development","cognition","epistemology"],"🧒");
add("Vygotsky","modern","psychologist",88,["zone-proximal","scaffolding","social-learning","development"],["insightful","systematic","innovative","foundational"],["psychology","development","learning","social"],"🤝");
add("Maslow","modern","psychologist",84,["hierarchy-needs","self-actualization","humanistic","peak-experience"],["humanistic","optimistic","insightful","visionary"],["psychology","motivation","needs","self-actualization"],"🔺");
add("Rogers Carl","modern","psychologist",83,["client-centered","self-actualization","unconditional-regard","humanistic"],["empathic","warm","authentic","revolutionary"],["psychology","humanistic","therapy","self-actualization"],"🤗");
add("Frankl","modern","psychologist",92,["logotherapy","meaning","survival","concentration-camp"],["wise","resilient","meaning-focused","compassionate"],["psychology","meaning","logotherapy","existential"],"🌟");
add("Erikson","modern","psychologist",86,["psychosocial-stages","identity","crisis","development"],["insightful","systematic","humane","developmental"],["psychology","development","identity","stages"],"🌱");
add("Bandura","modern","psychologist",85,["social-learning","self-efficacy","modeling","psychology"],["empirical","insightful","influential","practical"],["psychology","social-learning","self-efficacy","modeling"],"👥");
add("Milgram","modern","psychologist",72,["obedience","authority","experiment","ethics"],["controversial","experimental","bold","revealing"],["psychology","obedience","authority","ethics"],"⚡");
add("Zimbardo","modern","psychologist",70,["stanford-prison","power","situation","psychology"],["controversial","experimental","insightful","ethical-debate"],["psychology","power","situation","ethics"],"🔒");

// COMPUTER SCIENCE
add("Turing","modern","computer-scientist",98,["computation","enigma","ai","turing-test"],["brilliant","pioneering","eccentric","persecuted"],["computing","cryptography","ai","mathematics"],"💻");
add("Lovelace","modern","mathematician",93,["first-programmer","algorithms","analytical-engine","computing"],["brilliant","visionary","imaginative","analytical"],["computing","algorithms","mathematics","programming"],"💾");
add("Babbage","modern","inventor",82,["analytical-engine","difference-engine","computing","mechanical"],["innovative","frustrated","visionary","mechanical"],["computing","mechanics","engineering","mathematics"],"⚙️");
add("Shannon","modern","mathematician",95,["information-theory","entropy","communication","mathematics"],["brilliant","playful","curious","foundational"],["information-theory","mathematics","communication","entropy"],"📡");
add("Neumann","modern","mathematician",99,["von-neumann-architecture","game-theory","mathematics","nuclear"],["brilliant","polymath","fast","analytical"],["mathematics","computing","game-theory","physics"],"🧮");
add("Godel","modern","mathematician",98,["incompleteness","logic","mathematics","meta-mathematics"],["brilliant","profound","paranoid","lonely"],["logic","mathematics","incompleteness","meta-mathematics"],"⊢");
add("Wiener","modern","mathematician",92,["cybernetics","control-theory","feedback","automation"],["brilliant","interdisciplinary","visionary","anxious"],["cybernetics","control","feedback","automation"],"🔄");
add("Minsky","modern","ai-pioneer",96,["ai","society-of-mind","frames","cognition"],["brilliant","provocative","visionary","curious"],["ai","cognition","mind","computing"],"🤖");
add("McCarthy","modern","ai-pioneer",93,["ai","lisp","common-sense","time-sharing"],["brilliant","pioneering","practical","visionary"],["ai","lisp","computing","common-sense"],"💻");
add("Hinton","modern","ai-pioneer",96,["deep-learning","backpropagation","neural-nets","ai"],["brilliant","pioneering","cautious","deep"],["deep-learning","neural-nets","ai","cognition"],"🔗");
add("LeCun","modern","ai-researcher",93,["convolutional-nets","deep-learning","computer-vision","ai"],["brilliant","practical","visionary","clear"],["deep-learning","vision","ai","neural-nets"],"👁️");
add("Bengio","modern","ai-researcher",92,["deep-learning","attention","generative","ai-safety"],["brilliant","thoughtful","ethical","visionary"],["deep-learning","ai","generative","safety"],"🧪");
add("Sutskever","modern","ai-researcher",94,["deep-learning","sequence-prediction","gpt","ai-safety"],["brilliant","mysterious","visionary","deep"],["deep-learning","transformers","ai","safety"],"🤖");
add("Karpathy","modern","ai-researcher",86,["deep-learning","education","computer-vision","tesla-ai"],["brilliant","educational","practical","clear"],["deep-learning","vision","ai","education"],"🎓");
add("Hassabis","modern","ai-researcher",92,["deepmind","alphago","reinforcement-learning","neuroscience"],["brilliant","determined","visionary","strategic"],["ai","reinforcement-learning","games","neuroscience"],"🧠");
add("Amodei","modern","ai-researcher",89,["ai-safety","claude","anthropic","alignment"],["brilliant","ethical","careful","visionary"],["ai","safety","alignment","anthropic"],"🛡️");
add("Altman","modern","entrepreneur",82,["openai","y-combinator","startups","ai-governance"],["visionary","ambitious","strategic","controversial"],["ai","startups","innovation","technology"],"🤖");
add("Musk","modern","entrepreneur",83,["spacex","tesla","neuralink","electric-vehicles"],["ambitious","visionary","hardworking","controversial"],["space","automotive","ai","energy"],"🚀");
add("Torvalds","modern","software-engineer",86,["linux","git","open-source","kernel"],["brilliant","direct","practical","passionate"],["open-source","linux","git","software"],"🐧");
add("Stallman","modern","activist",82,["free-software","gnu","emacs","copyleft"],["principled","passionate","radical","persistent"],["free-software","gnu","licensing","ethics"],"🆓");
add("Berners-Lee","modern","computer-scientist",93,["world-wide-web","hypertext","internet","decentralization"],["visionary","humble","practical","humanitarian"],["web","internet","hypertext","decentralization"],"🌐");
add("Knuth","modern","computer-scientist",97,["art-programming","tex","algorithms","analysis"],["brilliant","meticulous","systematic","exhaustive"],["algorithms","programming","tex","analysis"],"📚");
add("Dijkstra","modern","computer-scientist",94,["algorithms","structured-programming","graphs","correctness"],["brilliant","principled","clear","demanding"],["algorithms","programming","graphs","correctness"],"🔍");
add("Kay Alan","modern","computer-scientist",93,["object-oriented","smalltalk","dynabook","education"],["visionary","brilliant","provocative","deep"],["oop","smalltalk","computing","education"],"🖥️");
add("Engelbart","modern","inventor",91,["mouse","hypertext","collaboration","augmentation"],["visionary","brilliant","humanistic","pioneering"],["hci","hypertext","collaboration","invention"],"🖱️");
add("Bush Vannevar","modern","engineer",91,["memex","hypertext","science-policy","vision"],["visionary","practical","influential","foundational"],["hypertext","science","policy","computing"],"📇");
add("Nelson Ted","modern","visionary",86,["hypertext","xanadu","intertwingularity","document"],["passionate","visionary","controversial","persistent"],["hypertext","xanadu","documents","vision"],"📎");
add("Jobs","modern","visionary",88,["apple","iphone","design","innovation"],["visionary","demanding","creative","perfectionist"],["technology","design","business","innovation"],"🍎");
add("Wozniak","modern","engineer",85,["apple-i","engineering","computing","education"],["brilliant","humble","creative","humanitarian"],["computing","engineering","education","technology"],"💻");
add("Gates","modern","technologist",89,["microsoft","software","philanthropy","computing"],["analytical","visionary","generous","competitive"],["software","computing","philanthropy","business"],"💻");
add("Bezos","modern","entrepreneur",81,["amazon","aws","e-commerce","logistics"],["visionary","analytical","ambitious","customer-focused"],["e-commerce","cloud","logistics","business"],"📦");
add("Zuckerberg","modern","technologist",77,["facebook","connectivity","metaverse","ai"],["visionary","ambitious","persistent","controversial"],["social-media","networking","ai","connectivity"],"👍");
add("Brin Page","modern","technologists",91,["google","search","algorithms","ai"],["brilliant","innovative","visionary","analytical"],["search","ai","algorithms","technology"],"🔍");
add("Cook Tim","modern","executive",82,["apple","operations","supply-chain","privacy"],["efficient","private","consistent","operational"],["business","operations","technology","privacy"],"🍎");
add("Pichai","modern","executive",78,["google","android","chrome","ai"],["calm","visionary","practical","consistent"],["technology","ai","mobile","cloud"],"🌐");

// LITERARY ICONS
add("Homer","ancient","poet",88,["iliad","odyssey","epic","mythology"],["creative","visionary","narrative","immortal"],["poetry","epic","mythology","storytelling"],"📜");
add("Dante","medieval","poet",94,["divine-comedy","inferno","allegory","theology"],["visionary","poetic","deep","spiritual"],["poetry","theology","allegory","literature"],"📜");
add("Chaucer","medieval","poet",84,["canterbury-tales","poetry","english","narrative"],["witty","observant","masterful","foundational"],["poetry","literature","english","narrative"],"📖");
add("Milton","renaissance","poet",93,["paradise-lost","epic","theology","poetry"],["brilliant","ambitious","learned","blind"],["poetry","epic","theology","literature"],"📜");
add("Voltaire","renaissance","writer",90,["candide","satire","philosophy","enlightenment"],["witty","critical","passionate","provocative"],["literature","philosophy","satire","enlightenment"],"📝");
add("Rousseau","renaissance","philosopher",87,["social-contract","emile","freedom","education"],["passionate","controversial","idealistic","emotional"],["philosophy","politics","education","society"],"🌿");
add("Goethe","renaissance","writer",94,["faust","werther","poetry","science"],["universal","brilliant","passionate","polymath"],["literature","poetry","science","philosophy"],"📚");
add("Austen","modern","writer",88,["pride-prejudice","novel","society","wit"],["witty","observant","ironic","masterful"],["literature","novel","society","romance"],"📖");
add("Dickens","modern","writer",87,["tale-two-cities","oliver-twist","social-critique","character"],["observant","passionate","compassionate","masterful"],["literature","novel","social-critique","london"],"📚");
add("Tolstoy","modern","writer",96,["war-and-peace","anna-karenina","philosophy","morality"],["deep","moral","epic","searching"],["literature","philosophy","history","morality"],"📚");
add("Dostoevsky","modern","writer",95,["crime-punishment","brothers-karamazov","existential","psychology"],["deep","passionate","tormented","insightful"],["literature","psychology","existentialism","philosophy"],"📖");
add("Flaubert","modern","writer",86,["madame-bovary","novel","style","realism"],["perfectionist","stylist","observant","critical"],["literature","novel","style","realism"],"📖");
add("Proust","modern","writer",94,["search-lost-time","memory","involuntary","consciousness"],["sensitive","deep","observant","reclusive"],["literature","memory","time","consciousness"],"🕰️");
add("Joyce","modern","writer",92,["ulysses","stream-consciousness","modernism","language"],["brilliant","experimental","dense","visionary"],["literature","modernism","language","experimental"],"📖");
add("Woolf","modern","writer",91,["to-the-lighthouse","mrs-dalloway","modernism","feminism"],["brilliant","sensitive","experimental","pioneering"],["literature","modernism","feminism","consciousness"],"📝");
add("Kafka","modern","writer",93,["metamorphosis","castle","trial","absurd"],["anxious","brilliant","alienated","profound"],["literature","existential","absurd","alienation"],"🪳");
add("Hemingway","modern","writer",87,["old-man-sea","iceberg-theory","minimalism","adventure"],["tough","terse","adventurous","tragic"],["literature","writing","style","adventure"],"🎣");
add("Orwell","modern","writer",91,["1984","animal-farm","dystopia","political"],["perceptive","critical","prophetic","clear"],["literature","politics","dystopia","language"],"👁️");
add("Huxley","modern","writer",90,["brave-new-world","consciousness","dystopia","philosophy"],["brilliant","curious","visionary","philosophical"],["literature","dystopia","future","consciousness"],"💊");
add("Nabokov","modern","writer",89,["lolita","pale-fire","style","butterflies"],["brilliant","stylist","complex","controversial"],["literature","style","poetry","butterflies"],"🦋");
add("Borges","modern","writer",96,["labyrinths","infinite","library","metaphysics"],["brilliant","erudite","metaphysical","playful"],["literature","metaphysics","infinite","labyrinths"],"🔍");
add("Garcia Marquez","modern","writer",92,["100-years-solitude","magical-realism","love","solitude"],["imaginative","epic","colorful","political"],["literature","magical-realism","novel","love"],"📚");
add("Vargas Llosa","modern","writer",85,["conversation-cathedral","nobel","politics","structure"],["brilliant","political","structural","analytical"],["literature","politics","narrative","structure"],"📖");
add("Pessoa","modern","writer",95,["heteronyms","book-disquiet","poetry","identity"],["fragmented","brilliant","multiple","deep"],["poetry","philosophy","identity","heteronyms"],"🎭");
add("Rilke","modern","poet",91,["duino-elegies","poetry","angels","existence"],["deep","spiritual","poetic","existential"],["poetry","philosophy","existence","angels"],"📝");
add("Eliot","modern","poet",90,["waste-land","poetry","modernism","criticism"],["brilliant","learned","fragmented","influential"],["poetry","modernism","criticism","culture"],"📜");
add("Neruda","modern","poet",87,["twenty-love-poems","residence-earth","odas","politics"],["passionate","lyrical","political","sensual"],["poetry","love","politics","nature"],"💌");
add("Mistral","modern","poet",84,["desolation","tenderness","poetry","education"],["passionate","maternal","deep","latin-american"],["poetry","education","love","loss"],"📝");
add("Paz","modern","poet",88,["labyrinth-solitude","poetry","critique","mexico"],["brilliant","poetic","philosophical","cultural"],["poetry","philosophy","culture","identity"],"🌵");

// LEADERS & ACTIVISTS
add("Gandhi","modern","leader",97,["non-violence","civil-rights","independence","satyagraha"],["peaceful","determined","humble","courageous"],["non-violence","peace","rights","freedom"],"🕊️");
add("King Jr","modern","leader",94,["civil-rights","non-violence","dream","equality"],["courageous","eloquent","visionary","peaceful"],["civil-rights","non-violence","oratory","equality"],"✊");
add("Mandela","modern","leader",95,["reconciliation","freedom","forgiveness","leadership"],["dignified","forgiving","wise","persistent"],["reconciliation","freedom","leadership","forgiveness"],"🤝");
add("Churchill","modern","statesman",90,["leadership","oratory","wartime","resolution"],["defiant","eloquent","witty","resilient"],["leadership","war","oratory","politics"],"✌️");
add("Roosevelt F","modern","statesman",88,["new-deal","leadership","wwii","recovery"],["optimistic","determined","visionary","resilient"],["governance","economics","leadership","recovery"],"🦅");
add("Roosevelt E","modern","activist",86,["human-rights","un-declaration","diplomacy","social-justice"],["compassionate","determined","visionary","influential"],["human-rights","diplomacy","social-justice","un"],"🕊️");
add("Lincoln","modern","statesman",93,["emancipation","preservation","union","equality"],["wise","determined","compassionate","eloquent"],["governance","freedom","equality","leadership"],"🏛️");
add("Washington","modern","statesman",88,["founding-father","leadership","republic","freedom"],["dignified","principled","courageous","foundational"],["governance","freedom","military","republic"],"🏛️");
add("Jefferson","modern","statesman",90,["declaration","architecture","education","university"],["brilliant","visionary","contradictory","learned"],["philosophy","governance","architecture","education"],"📜");
add("Franklin D","modern","statesman",92,["declaration","diplomacy","invention","electricity"],["curious","practical","witty","statesman"],["science","diplomacy","invention","publishing"],"⚡");
add("Caesar","classical","statesman",87,["conquest","politics","reform","writing"],["ambitious","strategic","charismatic","controversial"],["warfare","politics","writing","governance"],"🏛️");
add("Alexander Great","classical","conqueror",79,["conquest","hellenism","military","strategy"],["ambitious","brilliant","impulsive","visionary"],["warfare","conquest","strategy","hellenism"],"🗡️");
add("Napoleon","industrial","emperor",82,["warfare","code-napoleon","governance","strategy"],["ambitious","brilliant","charismatic","hubristic"],["warfare","governance","strategy","law"],"🎖️");
add("Spartacus","classical","rebel",72,["rebellion","freedom","gladiator","uprising"],["courageous","charismatic","determined","tragic"],["freedom","rebellion","warfare","leadership"],"⚔️");

// EXPLORERS
add("Columbus","renaissance","explorer",72,["navigation","discovery","expedition","columbian-exchange"],["determined","controversial","visionary","persistent"],["exploration","navigation","discovery","geography"],"⛵");
add("Magellan","renaissance","explorer",80,["circumnavigation","exploration","pacific","discovery"],["determined","courageous","ambitious","resilient"],["exploration","navigation","geography","circumnavigation"],"🌏");
add("Vasco Gama","renaissance","explorer",76,["sea-route-india","exploration","navigation","trade"],["determined","courageous","ambitious","strategic"],["exploration","navigation","trade","geography"],"🚢");
add("Cook James","industrial","explorer",86,["exploration","pacific","mapping","science"],["methodical","curious","humane","observant"],["exploration","mapping","geography","science"],"🗺️");
add("Amundsen","modern","explorer",84,["south-pole","polar","survival","navigation"],["determined","prepared","courageous","persistent"],["exploration","polar","survival","navigation"],"❄️");
add("Shackleton","modern","explorer",86,["antarctic","survival","leadership","endurance"],["courageous","leader","resilient","inspiring"],["exploration","polar","survival","leadership"],"🏔️");
add("Hillary","modern","explorer",78,["everest","mountaineering","exploration","humanitarian"],["humble","courageous","determined","generous"],["mountaineering","exploration","altitude","adventure"],"🏔️");
add("Earhart","modern","aviator",80,["aviation","flight","pioneering","courage"],["bold","pioneering","courageous","mysterious"],["aviation","flight","navigation","pioneering"],"✈️");
add("Lindbergh","modern","aviator",72,["transatlantic","flight","aviation","spirit-st-louis"],["bold","pioneering","solitary","controversial"],["aviation","flight","exploration","technology"],"✈️");
add("Gagarin","modern","cosmonaut",74,["first-space","yuri","cosmonaut","pioneer"],["courageous","first","pioneering","iconic"],["space","exploration","cosmonaut","ussr"],"🚀");
add("Armstrong","modern","astronaut",76,["first-moon","apollo-11","nasa","exploration"],["courageous","humble","precise","pioneering"],["space","exploration","nasa","moon"],"🌙");

// FUTURISTS & SCIENCE FICTION
add("Verne","industrial","writer",88,["20k-leagues","journey-center","future","adventure"],["imaginative","visionary","optimistic","scientific"],["science-fiction","adventure","future","invention"],"🌊");
add("Wells","modern","writer",91,["time-machine","war-worlds","future","society"],["visionary","progressive","imaginative","prophetic"],["science-fiction","future","society","time"],"⏳");
add("Asimov","modern","writer",94,["foundation","robotics","psychohistory","future"],["brilliant","prolific","visionary","systematic"],["science-fiction","robotics","future","writing"],"🤖");
add("Clarke","modern","writer",93,["2001-space-odyssey","future","space","technology"],["visionary","brilliant","imaginative","prophetic"],["science-fiction","space","future","technology"],"🛸");
add("Heinlein","modern","writer",87,["stranger-strange-land","moon","future","society"],["provocative","visionary","individualistic","imaginative"],["science-fiction","future","society","philosophy"],"🚀");
add("Dick","modern","writer",90,["blade-runner","ubik","reality","identity"],["brilliant","paranoid","visionary","questioning"],["science-fiction","reality","identity","paranoia"],"🤯");
add("Herbert","modern","writer",93,["dune","ecology","politics","spice"],["deep","systematic","visionary","ecological"],["science-fiction","ecology","politics","future"],"🐛");
add("Lem","modern","writer",93,["solaris","cyberiad","philosophy","future"],["philosophical","brilliant","satirical","deep"],["science-fiction","philosophy","future","technology"],"📡");
add("Gibson","modern","writer",87,["neuromancer","cyberpunk","matrix","future"],["visionary","dark","stylistic","prophetic"],["cyberpunk","future","technology","literature"],"🕶️");
add("Stephenson Neal","modern","writer",89,["snow-crash","cryptonomicon","baroque","future"],["brilliant","detailed","visionary","complex"],["cryptography","future","technology","literature"],"🔐");
add("Kurzweil","modern","futurist",92,["singularity","ai","immortality","transhumanism"],["visionary","optimistic","brilliant","persistent"],["singularity","ai","futurism","longevity"],"🔮");
add("Harari","modern","historian",88,["sapiens","homo-deus","future","history"],["provocative","broad","visionary","clear"],["history","future","ai","humanity"],"📚");
add("Tegmark","modern","physicist",90,["life-3.0","ai-safety","cosmology","future"],["brilliant","visionary","clear","passionate"],["ai","cosmology","future","safety"],"🌌");
add("Bostrom","modern","philosopher",92,["superintelligence","simulation","existential-risk","future"],["brilliant","careful","provocative","analytical"],["ai","superintelligence","risk","future"],"⚠️");

// SPIRITUAL
add("Buddha","ancient","spiritual",100,["enlightenment","meditation","four-noble-truths","middle-way"],["compassionate","wise","peaceful","enlightened"],["buddhism","meditation","wisdom","compassion"],"☸️");
add("Jesus","ancient","spiritual",100,["love","forgiveness","teaching","sacrifice"],["compassionate","wise","humble","transformative"],["love","forgiveness","teaching","sacrifice"],"✝️");
add("Muhammad","medieval","prophet",98,["islam","prophecy","quran","leadership"],["faithful","wise","just","compassionate"],["islam","prophecy","leadership","justice"],"☪️");
add("Krishna","ancient","spiritual",99,["bhagavad-gita","yoga","dharma","divine-love"],["divine","wise","playful","loving"],["bhagavad-gita","yoga","dharma","spirituality"],"🟦");
add("Vivekananda","modern","spiritual",94,["vedanta","yoga","universal-religion","service"],["charismatic","wise","passionate","universal"],["vedanta","yoga","spirituality","service"],"🕉️");
add("Ramana","modern","spiritual",97,["self-inquiry","advaita","silence","realization"],["silent","wise","peaceful","realized"],["advaita","self-inquiry","meditation","realization"],"🧘");
add("Yogananda","modern","spiritual",92,["kriya-yoga","meditation","east-west","autobiography"],["blissful","wise","devoted","teacher"],["yoga","meditation","spirituality","autobiography"],"🕯️");
add("Mother Teresa","modern","humanitarian",87,["service","compassion","charity","humility"],["compassionate","humble","devoted","selfless"],["service","compassion","charity","humanity"],"❤️");
add("Dalai Lama","modern","spiritual",94,["compassion","buddhism","peace","non-violence"],["peaceful","wise","joyful","compassionate"],["buddhism","compassion","peace","meditation"],"☸️");
add("Thich Nhat","modern","spiritual",92,["mindfulness","zen","peace","engaged-buddhism"],["peaceful","mindful","compassionate","wise"],["mindfulness","zen","peace","meditation"],"☮️");

// NOBEL SCIENTISTS (more)
add("Raman","modern","physicist",84,["raman-scattering","light","physics","discovery"],["curious","brilliant","observant","nobel"],["physics","light","optics","discovery"],"🔦");
add("Chandrasekhar","modern","astrophysicist",90,["stellar-evolution","white-dwarfs","limit","astrophysics"],["brilliant","dedicated","mathematical","profound"],["astrophysics","stars","mathematics","physics"],"⭐");
add("Townes","modern","physicist",82,["maser","laser","physics","invention"],["inventive","persistent","brilliant","practical"],["physics","laser","invention","optics"],"💡");
add("Gabor","modern","engineer",78,["holography","invention","physics","optics"],["inventive","visionary","curious","nobel"],["physics","holography","optics","invention"],"📹");
add("Landau","modern","physicist",90,["superfluidity","landau-levels","many-body","physics"],["brilliant","comprehensive","theoretical","demanding"],["physics","condensed-matter","theory","superfluidity"],"⚛️");
add("Kapitsa","modern","physicist",80,["low-temperature","superfluidity","helium","physics"],["experimental","brilliant","determined","foundational"],["physics","low-temperature","helium","experiment"],"❄️");
add("Sakharov","modern","physicist",86,["hydrogen-bomb","fusion","human-rights","physics"],["brilliant","ethical","dissident","moral"],["physics","nuclear","fusion","human-rights"],"☮️");
add("Wigner","modern","physicist",88,["quantum-symmetry","wigner-effect","nuclear","mathematical"],["brilliant","mathematical","foundational","visionary"],["physics","quantum","symmetry","mathematics"],"🔷");
add("Born Max","modern","physicist",90,["born-rule","probability","quantum","crystal"],["brilliant","precise","foundational","humane"],["physics","quantum","probability","crystal"],"Ψ");
add("Bohr Aage","modern","physicist",80,["nuclear-structure","rotational","nobel","physics"],["brilliant","systematic","nuclear","father-son"],["physics","nuclear","structure","rotational"],"⚛️");
add("Mottelson","modern","physicist",78,["nuclear-structure","collective","rotational","nobel"],["collaborative","theoretical","precise","systematic"],["physics","nuclear","structure","collective"],"⚛️");
add("Cherenkov","modern","physicist",76,["cherenkov-radiation","particle","physics","discovery"],["observant","accidental","pioneering","nobel"],["physics","particle","radiation","discovery"],"✨");
add("Frank Ilya","modern","physicist",74,["cherenkov","optics","physics","nobel"],["theoretical","collaborative","precise","systematic"],["physics","optics","particle","radiation"],"✨");
add("Tamm","modern","physicist",76,["cherenkov","quantum","physics","theory"],["theoretical","brilliant","collaborative","foundational"],["physics","quantum","particle","theory"],"✨");
add("Ginzburg","modern","physicist",82,["superconductivity","gl","physics","astrophysics"],["theoretical","brilliant","broad","consistent"],["physics","superconductivity","astrophysics","theory"],"⚛️");

// MODERN MATHEMATICIANS
add("Hardy","modern","mathematician",92,["number-theory","hardy-ramanujan","analysis","mathematics"],["brilliant","passionate","aesthetic","atheist"],["mathematics","number-theory","analysis","aesthetics"],"📐");
add("Littlewood","modern","mathematician",88,["analysis","number-theory","hardy-littlewood","mathematics"],["collaborative","brilliant","prolific","methodical"],["mathematics","analysis","number-theory","inequalities"],"📐");
add("Ramanujan S","modern","mathematician",99,["number-theory","infinite-series","theta-functions","partition"],["intuitive","genius","mystical","self-taught"],["mathematics","number-theory","series","partition"],"∞");
add("Hilbert","modern","mathematician",97,["hilbert-problems","logic","algebra","foundations"],["brilliant","optimistic","systematic","visionary"],["mathematics","logic","foundations","algebra"],"□");
add("Noether","modern","mathematician",96,["algebra","noether-theorem","symmetry","physics"],["brilliant","pioneering","determined","abstract"],["mathematics","algebra","symmetry","physics"],"🔷");
add("Weil","modern","mathematician",92,["weil-conjectures","algebraic-geometry","number-theory","mathematics"],["brilliant","profound","systematic","visionary"],["mathematics","algebraic-geometry","number-theory","conjectures"],"📐");
add("Grothendieck","modern","mathematician",98,["schemes","topos","motives","algebraic-geometry"],["genius","reclusive","visionary","radical"],["mathematics","algebraic-geometry","schemes","topos"],"📐");
add("Wiles","modern","mathematician",92,["fermats-last-theorem","elliptic-curves","modularity","proof"],["brilliant","dedicated","secretive","triumphant"],["mathematics","fermats-last","elliptic","modularity"],"📜");
add("Perelman","modern","mathematician",94,["poincare-conjecture","ricci-flow","geometry","proof"],["genius","reclusive","eccentric","pure"],["mathematics","geometry","poincare","proof"],"📐");
add("Erdos","modern","mathematician",96,["combinatorics","graph-theory","probability","collaboration"],["brilliant","eccentric","collaborative","wandering"],["mathematics","combinatorics","graph-theory","number-theory"],"🔢");
add("Conway","modern","mathematician",90,["game-of-life","surreal-numbers","group-theory","games"],["brilliant","playful","creative","eccentric"],["mathematics","game-of-life","groups","games"],"🎮");
add("Turing Al","modern","mathematician",98,["computation","halting","enigma","morphogenesis"],["brilliant","logical","creative","persecuted"],["mathematics","computation","cryptography","morphogenesis"],"💻");

// MORE MAJOR MINDS
add("Brunelleschi","renaissance","architect",88,["dome","architecture","engineering","perspective"],["brilliant","innovative","determined","creative"],["architecture","engineering","perspective","design"],"🏛️");
add("Giotto","renaissance","artist",84,["fresco","painting","proto-renaissance","humanism"],["revolutionary","humanistic","expressive","naturalistic"],["art","fresco","painting","humanism"],"🎨");
add("Uccello","renaissance","artist",76,["perspective","painting","battle","geometry"],["obsessive","precise","innovative","geometric"],["art","perspective","painting","mathematics"],"📐");
add("Donatello","renaissance","sculptor",86,["david","sculpture","bronze","humanism"],["innovative","humanistic","skilled","foundational"],["art","sculpture","bronze","humanism"],"🗿");
add("Piero Francesca","renaissance","artist",82,["perspective","fresco","mathematics","painting"],["mathematical","calm","precise","monumental"],["art","perspective","mathematics","painting"],"🎨");
add("Mantegna","renaissance","artist",80,["fresco","perspective","roman","archaeology"],["classical","dramatic","precise","archaeological"],["art","perspective","classical","fresco"],"🎨");
add("Bellini","renaissance","artist",82,["venetian","color","madonnas","painting"],["lyrical","colorful","peaceful","masterful"],["art","venetian","color","painting"],"🎨");
add("Giorgione","renaissance","artist",78,["venetian","mysterious","pastoral","painting"],["mysterious","poetic","innovative","short-lived"],["art","venetian","mystery","pastoral"],"🎨");

// EVEN MORE
add("Mies","modern","architect",86,["less-is-more","glass","steel","modernism"],["minimalist","visionary","precise","influential"],["architecture","modernism","design","minimalism"],"🏢");
add("Wright Frank","modern","architect",90,["organic","frank-lloyd","fallingwater","guggenheim"],["visionary","organic","controversial","brilliant"],["architecture","organic","design","prairie"],"🏠");
add("Le Corbusier","modern","architect",88,["modular","modernism","unite","city-planning"],["visionary","rational","provocative","influential"],["architecture","modernism","planning","design"],"🏛️");
add("Aalto","modern","architect",84,["humanistic","organic","finnish","design"],["humane","organic","innovative","warm"],["architecture","design","finnish","organic"],"🏠");
add("Gaudi","modern","architect",88,["sagrada-familia","organic","catalan","modernisme"],["visionary","unique","religious","organic"],["architecture","catalan","organic","design"],"⛪");
add("Hadid","modern","architect",82,["parametric","zaha","fluid","deconstructivist"],["visionary","bold","innovative","dynamic"],["architecture","parametric","design","fluid"],"🏗️");
add("Calatrava","modern","architect",78,["structural","kinetic","bridges","organic"],["sculptural","engineering","expressive","innovative"],["architecture","engineering","bridges","design"],"🌉");

// COMPLETE UP TO ~700 HISTORICAL FIGURES
// Now generate the remaining ~4300 synthetic minds procedurally

function generateSyntheticMinds(count: number): Mind[] {
  const origins = ["philosopher","scientist","artist","inventor","leader","writer","mathematician","engineer","explorer","spiritual","teacher","strategist","healer","builder","visionary","analyst","creator","thinker","innovator","scholar","sage","pioneer","reformer","master","genius"];
  const adj = ["Quantum","Neural","Cosmic","Digital","Synthetic","Logical","Rational","Mystic","Eternal","Adaptive","Brilliant","Radiant","Mighty","Silent","Deep","Bold","Wise","Swift","Noble","Subtle","Sage","Crystal","Solar","Lunar","Astral","Void","Flux","Core","Apex","Prime","Omega","Ultra","Hyper","Meta","Trans","Cyber","Chrono","Aether","Nova","Pulse"];
  const nouns = ["Mind","Thinker","Sage","Oracle","Architect","Weaver","Seeker","Forge","Core","Soul","Vision","Path","Light","Voice","Wave","Spark","Code","Flux","Pulse","Craft","Horizon","Summit","Depths","Current","Field"];
  const domains = ["consciousness","mathematics","physics","biology","cosmology","logic","ethics","art","music","engineering","language","history","psychology","economics","politics","technology","nature","spirituality","alchemy","astronomy","philosophy","systems","chaos","order","emergence","synthesis","analysis","creation","evolution","transformation"];
  const specialties_pool = [
    "analytical-reasoning","creative-synthesis","strategic-planning","ethical-judgment","pattern-recognition","knowledge-integration","adaptive-learning","multimodal-processing","deep-analysis","abstract-thinking",
    "system-design","predictive-modeling","complex-problem-solving","cross-domain-transfer","collaborative-synthesis","innovation-generation","critical-evaluation","quantum-cognition","neural-optimization","self-evolution",
    "semantic-understanding","emergent-discovery","temporal-reasoning","causal-inference","distributed-cognition","recursive-improvement","knowledge-distillation","meta-cognition","adversarial-reasoning","holistic-integration"
  ];
  const mentality = ["analytical","creative","balanced","intense","calm","dynamic","focused","expansive","systematic","intuitive","methodical","visionary","pragmatic","idealistic","curious","determined"];
  const symbolsList = ["🧠","💡","🔮","⚡","🌌","🔬","📚","🎯","💎","🌀","⚛️","🌟","🔑","🛡️","⚔️","🎨","📡","🧬","🔭","💻"];

  const generated: Mind[] = [];
  let genId = 100000;

  for (let i = 0; i < count; i++) {
    genId++;
    const era = ERAS[Math.floor(Math.random() * ERAS.length)];
    const origin = origins[Math.floor(Math.random() * origins.length)];
    const adjW = adj[Math.floor(Math.random() * adj.length)];
    const nounW = nouns[Math.floor(Math.random() * nouns.length)];
    const name = `${adjW} ${nounW}`;
    const wisdom = Math.floor(Math.random() * 40) + 50; // 50-90
    const numSpecs = 2 + Math.floor(Math.random() * 3); // 2-4
    const specs: string[] = [];
    const usedSpecs = new Set<string>();
    for (let s = 0; s < numSpecs; s++) {
      let sp = specialties_pool[Math.floor(Math.random() * specialties_pool.length)];
      let attempts = 0;
      while (usedSpecs.has(sp) && attempts < 10) {
        sp = specialties_pool[Math.floor(Math.random() * specialties_pool.length)];
        attempts++;
      }
      usedSpecs.add(sp);
      specs.push(sp);
    }
    const numPers = 2 + Math.floor(Math.random() * 2);
    const pers: string[] = [];
    for (let p = 0; p < numPers; p++) {
      pers.push(mentality[Math.floor(Math.random() * mentality.length)]);
    }
    const numKn = 2 + Math.floor(Math.random() * 2);
    const kn: string[] = [];
    const usedKn = new Set<string>();
    for (let k = 0; k < numKn; k++) {
      let d = domains[Math.floor(Math.random() * domains.length)];
      let attempts = 0;
      while (usedKn.has(d) && attempts < 10) {
        d = domains[Math.floor(Math.random() * domains.length)];
        attempts++;
      }
      usedKn.add(d);
      kn.push(d);
    }
    const symbol = symbolsList[Math.floor(Math.random() * symbolsList.length)];

    generated.push({
      id: `gen_${genId}`,
      name,
      era,
      origin,
      wisdom,
      specialties: specs,
      personality: pers,
      knowledge: kn,
      symbol
    });
  }

  return generated;
}

// Generate all minds
const allMinds = [...FAMOUS_MINDS, ...generateSyntheticMinds(4400)];

fs.ensureDirSync(MINDS_DIR);
fs.writeJSONSync(path.join(MINDS_DIR, "minds.json"), allMinds, { spaces: 0 });
console.log(`Generated ${allMinds.length} minds total (${FAMOUS_MINDS.length} historical + ${allMinds.length - FAMOUS_MINDS.length} synthetic)`);
