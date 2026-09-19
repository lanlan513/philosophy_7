'use strict';

/**
 * 馆藏数据：词语标本、哲学家、引文（回声）、桌面布局。
 * 布局坐标单位为视口百分比（vw / vh），由客户端按词的位置换算为相对偏移。
 */

const PHILOSOPHERS = {
  socrates:     { id: 'socrates',     name: '苏格拉底',   latin: 'Socrates',          years: '前 470 — 前 399', born: -470 },
  plato:        { id: 'plato',        name: '柏拉图',     latin: 'Plato',             years: '前 427 — 前 347', born: -427 },
  aristotle:    { id: 'aristotle',    name: '亚里士多德', latin: 'Aristotle',         years: '前 384 — 前 322', born: -384 },
  epicurus:     { id: 'epicurus',     name: '伊壁鸠鲁',   latin: 'Epicurus',          years: '前 341 — 前 270', born: -341 },
  marcus:       { id: 'marcus',       name: '马可·奥勒留', latin: 'Marcus Aurelius',  years: '121 — 180',       born: 121 },
  montaigne:    { id: 'montaigne',    name: '蒙田',       latin: 'Montaigne',         years: '1533 — 1592',     born: 1533 },
  descartes:    { id: 'descartes',    name: '笛卡尔',     latin: 'Descartes',         years: '1596 — 1650',     born: 1596 },
  hume:         { id: 'hume',         name: '休谟',       latin: 'Hume',              years: '1711 — 1776',     born: 1711 },
  rousseau:     { id: 'rousseau',     name: '卢梭',       latin: 'Rousseau',          years: '1712 — 1778',     born: 1712 },
  kant:         { id: 'kant',         name: '康德',       latin: 'Kant',              years: '1724 — 1804',     born: 1724 },
  schopenhauer: { id: 'schopenhauer', name: '叔本华',     latin: 'Schopenhauer',      years: '1788 — 1860',     born: 1788 },
  kierkegaard:  { id: 'kierkegaard',  name: '克尔凯郭尔', latin: 'Kierkegaard',       years: '1813 — 1855',     born: 1813 },
  nietzsche:    { id: 'nietzsche',    name: '尼采',       latin: 'Nietzsche',         years: '1844 — 1900',     born: 1844 },
  wittgenstein: { id: 'wittgenstein', name: '维特根斯坦', latin: 'Wittgenstein',      years: '1889 — 1951',     born: 1889 },
  sartre:       { id: 'sartre',       name: '萨特',       latin: 'Sartre',            years: '1905 — 1980',     born: 1905 },
  beauvoir:     { id: 'beauvoir',     name: '波伏娃',     latin: 'Simone de Beauvoir', years: '1908 — 1986',    born: 1908 },
  camus:        { id: 'camus',        name: '加缪',       latin: 'Camus',             years: '1913 — 1960',     born: 1913 },
};

const WORDS = [
  {
    id: 'freedom', word: '自由', latin: 'LIBERTAS', no: '001',
    hint: '被束缚者最先听见的词',
    pos: { x: 15, y: 30, r: -3 },
    layout: {
      quotes: [{ x: 26, y: 10 }, { x: 52, y: 26 }, { x: 56, y: 44 }],
      timeline: { x: 30, y: 64, w: 40 },
      empty: { x: 30, y: 42 },
    },
    echoes: [
      { pid: 'rousseau',  quote: '人生而自由，却无往不在枷锁之中。', source: '《社会契约论 · 卷一》' },
      { pid: 'sartre',    quote: '人是被判定为自由的。', source: '《存在与虚无》' },
      { pid: 'beauvoir',  quote: '我们的自由，只有经由他人的自由才算完成。', source: '《模糊性的道德》' },
    ],
  },
  {
    id: 'soul', word: '灵魂', latin: 'ANIMA', no: '002',
    hint: '身体里最轻的房客',
    pos: { x: 58, y: 17, r: 2 },
    layout: {
      quotes: [{ x: 26, y: 24 }, { x: 44, y: 40 }, { x: 70, y: 33 }],
      timeline: { x: 44, y: 61, w: 36 },
      empty: { x: 60, y: 36 },
    },
    echoes: [
      { pid: 'plato',     quote: '灵魂是不死的，它在我们出生之前便已存在。', source: '《斐多篇》' },
      { pid: 'aristotle', quote: '灵魂是身体的第一实现。', source: '《论灵魂》' },
      { pid: 'descartes', quote: '我思，故我在。', source: '《谈谈方法》' },
    ],
  },
  {
    id: 'doubt', word: '怀疑', latin: 'DUBIUM', no: '003',
    hint: '一切确定的尽头',
    pos: { x: 36, y: 50, r: -1.5 },
    layout: {
      quotes: [{ x: 6, y: 22 }, { x: 52, y: 30 }, { x: 6, y: 52 }],
      timeline: { x: 10, y: 88, w: 40 },
      empty: { x: 40, y: 66 },
    },
    echoes: [
      { pid: 'montaigne', quote: '我知道什么？', source: '《随笔集》' },
      { pid: 'descartes', quote: '为求真理，人一生中总该把一切怀疑一次。', source: '《哲学原理》' },
      { pid: 'hume',      quote: '习惯是人生的伟大指南。', source: '《人类理解研究》' },
    ],
  },
  {
    id: 'happiness', word: '幸福', latin: 'FELICITAS', no: '004',
    hint: '被追问最多的状态',
    pos: { x: 78, y: 48, r: 2.5 },
    layout: {
      quotes: [{ x: 46, y: 27 }, { x: 20, y: 56 }, { x: 50, y: 62 }],
      timeline: { x: 64, y: 86, w: 32 },
      empty: { x: 62, y: 64 },
    },
    echoes: [
      { pid: 'aristotle',    quote: '幸福是按照完善的德性而进行的活动。', source: '《尼各马可伦理学》' },
      { pid: 'epicurus',     quote: '快乐是幸福生活的开端与归宿。', source: '《致美诺凯乌斯信》' },
      { pid: 'schopenhauer', quote: '幸福多半只是痛苦的缓和与缺席。', source: '《附录与补遗》' },
    ],
  },
  {
    id: 'absurd', word: '荒诞', latin: 'ABSURDUM', no: '005',
    hint: '世界沉默时的回声',
    pos: { x: 18, y: 72, r: -2 },
    layout: {
      quotes: [{ x: 36, y: 36 }, { x: 54, y: 58 }, { x: 32, y: 74 }],
      timeline: { x: 64, y: 88, w: 30 },
      empty: { x: 34, y: 58 },
    },
    echoes: [
      { pid: 'kierkegaard', quote: '生命只能倒着被理解，却必须正着被经历。', source: '《日记》' },
      { pid: 'sartre',      quote: '存在先于本质。', source: '《存在主义是一种人道主义》' },
      { pid: 'camus',       quote: '应当想象西西弗是幸福的。', source: '《西西弗神话》' },
    ],
  },
  {
    id: 'time', word: '时间', latin: 'TEMPUS', no: '006',
    hint: '最耐心的收藏家',
    pos: { x: 52, y: 80, r: 1 },
    layout: {
      quotes: [{ x: 16, y: 44 }, { x: 48, y: 44 }, { x: 72, y: 56 }],
      timeline: { x: 28, y: 32, w: 42 },
      empty: { x: 56, y: 64 },
    },
    echoes: [
      { pid: 'marcus',    quote: '时间是一条河，一切生成之物都被它卷走。', source: '《沉思录 · 卷四》' },
      { pid: 'kant',      quote: '时间是内感官的形式。', source: '《纯粹理性批判》' },
      { pid: 'nietzsche', quote: '愿你愿意这一生再活一次，乃至无数次。', source: '《快乐的科学 · 341》' },
    ],
  },
  {
    id: 'death', word: '死亡', latin: 'MORS', no: '007',
    hint: '唯一的必然展品',
    pos: { x: 84, y: 24, r: -2.5 },
    layout: {
      quotes: [{ x: 40, y: 6 }, { x: 30, y: 20 }, { x: 58, y: 40 }],
      timeline: { x: 30, y: 62, w: 38 },
      empty: { x: 60, y: 42 },
    },
    echoes: [
      { pid: 'socrates',     quote: '哲学，是死亡的练习。', source: '《斐多篇》' },
      { pid: 'epicurus',     quote: '死亡与我们无关：我们在时它不在，它在时我们不在。', source: '《致美诺凯乌斯信》' },
      { pid: 'wittgenstein', quote: '死亡不是生命中的一桩事件。', source: '《逻辑哲学论 · 6.4311》' },
    ],
  },
  {
    id: 'silence', word: '沉默', latin: 'SILENTIUM', no: '008',
    hint: '尚未被言说',
    pos: { x: 70, y: 74, r: 3 },
    layout: {
      quotes: [],
      timeline: { x: 44, y: 64, w: 30 },
      empty: { x: 44, y: 46 },
    },
    echoes: [], // 故意为空：这个词还没有关联人物，用于呈现"无回声"状态
  },
];

/** 展开一个词的回声：引文 + 完整人物信息，按出生年升序（年代线从左到右）。 */
function echoesFor(word) {
  return word.echoes
    .map((e) => ({ quote: e.quote, source: e.source, philosopher: PHILOSOPHERS[e.pid] }))
    .filter((e) => Boolean(e.philosopher))
    .sort((a, b) => a.philosopher.born - b.philosopher.born);
}

/** 列表接口用的精简视图（不含引文，含布局与回声数量）。 */
function publicWord(w) {
  return {
    id: w.id, word: w.word, latin: w.latin, no: w.no, hint: w.hint,
    pos: w.pos, layout: w.layout, echoCount: w.echoes.length,
  };
}

module.exports = { PHILOSOPHERS, WORDS, echoesFor, publicWord };
