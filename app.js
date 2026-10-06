"use strict";

const DOMAIN_DESC={
	H:["正直さ・謙虚さ","対人操作や不公平な利益を避ける傾向、地位・ぜいたくへの執着の低さ、自己評価の控えめさに関する尺度です。"],
	E:["情動性","身体的危険への恐れ、不安、人に支えを求める傾向、情緒的な共感の強さに関する尺度です。"],
	X:["外向性","自己表現、人前での大胆さ、社交性、活動的な活力に関する尺度です。"],
	A:["協調性","許しやすさ、他人への穏やかさ、反論や変更への柔軟さ、怒りにくさに関する尺度です。"],
	C:["勤勉性","整理整頓、努力の継続、細部と品質への注意、慎重な意思決定に関する尺度です。"],
	O:["経験への開放性","美的感受性、知的探究心、創造性、慣習にとらわれない傾向に関する尺度です。"]
};
const FACET_DESC={
	Sincerity:"人を操作するための演技やお世辞を避け、率直に関わる傾向。",
	Fairness:"不正や搾取を避け、公平さを重視する傾向。",
	"Greed Avoidance":"富・地位・ぜいたく・権力そのものを強く求めない傾向。",
	Modesty:"自分を特別に優れた存在として扱わず、控えめに自己評価する傾向。",
	Fearfulness:"身体的危険や脅威をどの程度怖いと感じるか。",
	Anxiety:"将来や出来事について心配・緊張しやすい傾向。",
	Dependence:"不安や困難の際に、他者の承認・助力・支えを求める傾向。",
	Sentimentality:"他人との情緒的な結びつきや、他者の苦痛に心を動かされる傾向。",
	Expressiveness:"言葉や感情を外に表す傾向。",
	"Social Boldness":"人前や対人場面で自信を持って振る舞う傾向。",
	Sociability:"人と一緒に過ごし、交流することを楽しむ傾向。",
	Liveliness:"活動性、元気さ、明るさ、内側からの活力に関する傾向。",
	Forgiveness:"傷つけられても恨みや報復心を長く維持しない傾向。",
	Gentleness:"他人の欠点に厳しくなりすぎず、穏やかに評価する傾向。",
	Flexibility:"反論・批判・変更を受けたときに柔軟に対応する傾向。",
	Patience:"いら立ちや怒りを起こしにくく、辛抱強くいられる傾向。",
	Organization:"身の回りや作業を整理し、秩序立てて保つ傾向。",
	Diligence:"努力を続け、課題を最後までやり遂げようとする傾向。",
	Perfectionism:"細部や品質に注意し、不完全さを減らそうとする傾向。",
	Prudence:"行動前に結果を考え、衝動的な判断を避ける傾向。",
	"Aesthetic Appreciation":"芸術・音楽・自然などの美的経験に価値を感じる傾向。",
	Inquisitiveness:"知識や複雑なテーマを学び、深く考えようとする傾向。",
	Creativity:"新しい発想や想像を生み出す傾向。",
	Unconventionality:"慣習や多数派から外れる考え方・振る舞いを受け入れる傾向。"
};
const LABELS=["ほぼ当てはまらない","あまり当てはまらない","本当に中間","やや当てはまる","かなり当てはまる"];
const ANSWER_DETAILS=[
	["明確に反対側","普段はほとんど当てはまらない","頻度なら0〜1 / 10程度","例外的に当てはまることはあってよい"],
	["どちらかといえば反対側","基本は当てはまらない","頻度なら2〜4 / 10程度","反対側が多いが、逆もそれなりにある"],
	["両側がほぼ同程度","どちらとも言えない","頻度ならほぼ5 / 10","「状況次第」というだけでは選ばない"],
	["どちらかといえばこちら側","基本は当てはまる","頻度なら6〜8 / 10程度","こちら側が多いが、逆もそれなりにある"],
	["明確にこちら側","普段はかなり当てはまる","頻度なら9〜10 / 10程度","例外的に反対になることはあってよい"]
];
const DOMAIN_ORDER=["H","E","X","A","C","O"];
let order=[];
let answers=new Map();
let pos=0;
let lastSave=null;
let showEnglish=false;
let startedAt=null;
let comparisonSnapshots=[];
let reviewQueue=[];
let reviewPos=0;
let reviewAcceptedKeys=new Set();
let reviewPass=0;
let reviewComplete=false;
let reviewDirty=false;

const $=id=>document.getElementById(id);

function todayLocal(){
	const d=new Date();
	const y=d.getFullYear();
	const m=String(d.getMonth()+1).padStart(2,"0");
	const day=String(d.getDate()).padStart(2,"0");
	return `${y}-${m}-${day}`;
}

function init(){
	$("assessmentDate").value=todayLocal();
	$("start").addEventListener("click",start);
	$("next").addEventListener("click",next);
	$("prev").addEventListener("click",prev);
	$("saveSession").addEventListener("click",()=>saveJson("ipip-hexaco-progress"));
	$("saveResult").addEventListener("click",()=>saveJson("ipip-hexaco-result"));
	$("showEnQuiz").addEventListener("change",e=>{ showEnglish=e.target.checked; render(); });
	$("loadSession").addEventListener("change",e=>{ const f=e.target.files[0]; if(f)loadSession(f); e.target.value=""; });
	$("compareFiles").addEventListener("change",e=>{ loadComparisons([...e.target.files]); e.target.value=""; });
	$("copyPrompt").addEventListener("click",copyPrompt);
	$("reviewNext").addEventListener("click",reviewNext);
	$("reviewAccept").addEventListener("click",reviewAccept);
	$("reviewSave").addEventListener("click",()=>saveJson("ipip-hexaco-review"));
	$("reviewShowEn").addEventListener("change",e=>{ showEnglish=e.target.checked; renderReview(); });
	$("reviewAgain").addEventListener("click",()=>{ reviewAcceptedKeys=new Set(); reviewComplete=false; reviewPass=0; beginReview(); });
	$("restart").addEventListener("click",()=>{ if(confirm("必要なら先にJSON保存してください。回答を消して最初からやり直しますか？")) location.reload(); });
	document.addEventListener("keydown",e=>{
		if(!$("quiz").classList.contains("hidden") && /^[1-5]$/.test(e.key)){
			const it=itemById(order[pos]);
			answers.set(it.id,Number(e.key));
			render();
		}
	});
}

function shuffleArray(a){
	const r=a.slice();
	for(let i=r.length-1;i>0;i--){
		const j=Math.floor(Math.random()*(i+1));
		[r[i],r[j]]=[r[j],r[i]];
	}
	return r;
}

function itemById(id){ return ITEMS[id-1]; }

function start(){
	answers=new Map();
	pos=0;
	lastSave=null;
	startedAt=new Date().toISOString();
	comparisonSnapshots=[];
	reviewQueue=[];
	reviewPos=0;
	reviewAcceptedKeys=new Set();
	reviewPass=0;
	reviewComplete=false;
	reviewDirty=false;
	order=$("shuffle").checked?shuffleArray(ITEMS.map(x=>x.id)):ITEMS.map(x=>x.id);
	showEnglish=$("showEnHome").checked;
	$("home").classList.add("hidden");
	$("resultPage").classList.add("hidden");
	$("quiz").classList.remove("hidden");
	render();
}

function render(){
	const it=itemById(order[pos]);
	$("questionNo").textContent=`質問 ${pos+1} / ${ITEMS.length}　ID ${it.id}　${it.domain} / ${it.facetJa}`;
	$("question").textContent=it.ja;
	$("note").textContent=it.note?`判断の補足: ${it.note}`:"";
	$("note").classList.toggle("hidden",!it.note);
	$("original").textContent=`原文: ${it.en}`;
	$("original").classList.toggle("hidden",!showEnglish);
	$("showEnQuiz").checked=showEnglish;
	const box=$("answers");
	box.innerHTML="";
	for(let v=1;v<=5;v++){
		const label=document.createElement("label");
		const input=document.createElement("input");
		const n=document.createElement("b");
		const desc=document.createElement("span");
		const details=document.createElement("span");
		input.type="radio";
		input.name="answer";
		input.value=String(v);
		input.checked=answers.get(it.id)===v;
		input.addEventListener("change",()=>{ answers.set(it.id,v); renderProgress(); });
		n.textContent=String(v);
		desc.className="answerLabel";
		desc.textContent=LABELS[v-1];
		details.className="answerDetails";
		for(const line of ANSWER_DETAILS[v-1]){
			const detail=document.createElement("span");
			detail.textContent=line;
			details.append(detail);
		}
		label.append(input,n,desc,details);
		box.append(label);
	}
	$("prev").disabled=pos===0;
	$("next").textContent=pos===ITEMS.length-1?"結果を見る":"次へ →";
	renderProgress();
	window.scrollTo({top:0,behavior:"instant"});
}

function renderProgress(){
	const pct=answers.size/ITEMS.length*100;
	$("progressBar").style.width=pct+"%";
	$("progressText").textContent=`回答済み ${answers.size} / ${ITEMS.length}`;
	$("saveText").textContent=lastSave?`最終保存 ${lastSave.toLocaleTimeString()}`:"未保存";
}

function next(){
	const it=itemById(order[pos]);
	if(!answers.has(it.id)){ alert("この質問に回答してください。"); return; }
	if(pos===ITEMS.length-1){
		if(answers.size!==ITEMS.length){ alert("未回答があります。"); return; }
		beginReview();
		return;
	}
	pos++;
	render();
}

function prev(){ if(pos>0){ pos--; render(); } }

function similarGroupDifference(group){
	const values=group.items.map(id=>keyed(itemById(id),answers.get(id)));
	return Math.max(...values)-Math.min(...values);
}

function reviewIssueStillRelevant(issue){
	if(reviewAcceptedKeys.has(issue.key))return false;
	if(issue.type==="neutral")return answers.get(issue.itemId)===3;
	if(issue.type==="similar")return similarGroupDifference(issue.group)>issue.group.max_difference;
	return false;
}

function buildReviewQueue(){
	const queue=[];
	for(const it of ITEMS){
		if(answers.get(it.id)===3){
			queue.push({type:"neutral",key:"neutral:"+it.id,itemId:it.id});
		}
	}
	for(const group of SIMILAR_GROUPS){
		if(similarGroupDifference(group)>group.max_difference){
			queue.push({type:"similar",key:"similar:"+group.id,group});
		}
	}
	return queue.filter(reviewIssueStillRelevant);
}

function beginReview(){
	reviewPass++;
	reviewQueue=buildReviewQueue();
	reviewPos=0;
	reviewDirty=false;
	$("home").classList.add("hidden");
	$("quiz").classList.add("hidden");
	$("resultPage").classList.add("hidden");
	$("reviewPage").classList.remove("hidden");
	if(!reviewQueue.length){
		reviewComplete=true;
		showResults();
		return;
	}
	renderReview();
}

function invalidateReviewAcceptance(itemId){
	reviewAcceptedKeys.delete("neutral:"+itemId);
	for(const group of SIMILAR_GROUPS){
		if(group.items.includes(itemId))reviewAcceptedKeys.delete("similar:"+group.id);
	}
}

function appendReviewScale(container,it,namePrefix){
	const scale=document.createElement("div");
	scale.className="answers reviewAnswers";
	for(let v=1;v<=5;v++){
		const label=document.createElement("label");
		const input=document.createElement("input");
		const n=document.createElement("b");
		const desc=document.createElement("span");
		input.type="radio";
		input.name=namePrefix;
		input.value=String(v);
		input.checked=answers.get(it.id)===v;
		input.addEventListener("change",()=>{
			answers.set(it.id,v);
			invalidateReviewAcceptance(it.id);
			reviewDirty=true;
			$("reviewDirty").textContent="回答を変更しました。次へ進むと再判定します。";
		});
		n.textContent=String(v);
		desc.textContent=LABELS[v-1];
		label.append(input,n,desc);
		scale.append(label);
	}
	container.append(scale);
}

function appendReviewQuestion(container,it,index){
	const card=document.createElement("div");
	card.className="reviewQuestion";
	const meta=document.createElement("div");
	meta.className="muted small";
	meta.textContent=`ID ${it.id}　${it.domain} / ${it.facetJa}　現在: ${answers.get(it.id)}（${LABELS[answers.get(it.id)-1]}）`;
	const q=document.createElement("div");
	q.className="reviewQuestionText";
	q.textContent=it.ja;
	card.append(meta,q);
	if(it.note){
		const note=document.createElement("div");
		note.className="note";
		note.textContent="判断の補足: "+it.note;
		card.append(note);
	}
	if(showEnglish){
		const en=document.createElement("div");
		en.className="original";
		en.textContent="原文: "+it.en;
		card.append(en);
	}
	appendReviewScale(card,it,`review-${reviewPass}-${reviewPos}-${index}-${it.id}`);
	container.append(card);
}

function renderReview(){
	while(reviewPos<reviewQueue.length && !reviewIssueStillRelevant(reviewQueue[reviewPos]))reviewPos++;
	if(reviewPos>=reviewQueue.length){
		const remaining=buildReviewQueue();
		if(!remaining.length){
			reviewComplete=true;
			showResults();
			return;
		}
		reviewPass++;
		reviewQueue=remaining;
		reviewPos=0;
	}
	const issue=reviewQueue[reviewPos];
	const box=$("reviewContent");
	box.innerHTML="";
	$("reviewShowEn").checked=showEnglish;
	$("reviewDirty").textContent="";
	$("reviewProgress").textContent=`見直し ${reviewPos+1} / ${reviewQueue.length}　（${reviewPass}周目）`;
	if(issue.type==="neutral"){
		$("reviewTitle").textContent="3（本当に中間）の回答を再確認";
		$("reviewReason").textContent="この設問は3を選んでいます。「状況による」だけで3にしていないか、本当にどちら側とも言えないかをもう一度確認してください。3が適切ならそのまま確定できます。";
		appendReviewQuestion(box,itemById(issue.itemId),0);
		$("reviewAccept").textContent="3のままで確定";
	}else{
		$("reviewTitle").textContent="似た質問どうしの回答を再確認";
		const diff=similarGroupDifference(issue.group);
		$("reviewReason").textContent=`${issue.group.reason} 逆転項目は内部で向きをそろえて比較したところ、回答傾向に ${diff} 段階の差があります。質問は完全同義ではないため、差に理由があるならそのまま確定して構いません。`;
		issue.group.items.forEach((id,i)=>appendReviewQuestion(box,itemById(id),i));
		$("reviewAccept").textContent="この差で確定";
	}
	$("reviewNext").textContent="変更を反映して次へ";
	window.scrollTo({top:0,behavior:"instant"});
}

function reviewNext(){
	reviewDirty=false;
	reviewPos++;
	renderReview();
}

function reviewAccept(){
	const issue=reviewQueue[reviewPos];
	reviewAcceptedKeys.add(issue.key);
	reviewDirty=false;
	reviewPos++;
	renderReview();
}

function keyed(it,v){ return it.key==="+"?v:6-v; }

function calc(map=answers){
	const ds={},fs={};
	for(const it of ITEMS){
		if(!map.has(it.id))continue;
		const v=keyed(it,map.get(it.id));
		const fk=it.domain+":"+it.facet;
		(ds[it.domain]??=[]).push(v);
		(fs[fk]??=[]).push(v);
	}
	const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
	const domains={},facets={};
	for(const [k,v] of Object.entries(ds)) if(v.length===40) domains[k]=mean(v);
	for(const [k,v] of Object.entries(fs)) if(v.length===10) facets[k]=mean(v);
	return {domains,facets};
}

function band(v){
	if(v<2.0)return"かなり低め";
	if(v<2.75)return"低め";
	if(v<=3.25)return"中央付近";
	if(v<=4.0)return"高め";
	return"かなり高め";
}

function showResults(){
	renderResults();
	$("quiz").classList.add("hidden");
	$("reviewPage").classList.add("hidden");
	$("home").classList.add("hidden");
	$("resultPage").classList.remove("hidden");
	updateNarrative();
	updateComparison();
	updateAiPrompt();
	window.scrollTo({top:0,behavior:"instant"});
}

function renderResults(){
	const sc=calc();
	const box=$("results");
	box.innerHTML="";
	for(const d of DOMAIN_ORDER){
		const [name,desc]=DOMAIN_DESC[d];
		const v=sc.domains[d];
		const card=document.createElement("div");
		card.className="result";
		card.innerHTML=`<div class="rtop"><h2>${d} — ${name}</h2><div class="score">${v.toFixed(2)}</div></div><div class="scoreBand">${band(v)}</div><div class="bar"><div style="width:${(v-1)/4*100}%"></div></div><p class="small">${desc}</p>`;
		for(const facet of [...new Set(ITEMS.filter(x=>x.domain===d).map(x=>x.facet))]){
			const f=ITEMS.find(x=>x.domain===d&&x.facet===facet);
			const fv=sc.facets[d+":"+facet];
			const row=document.createElement("div");
			row.className="facet";
			row.title=FACET_DESC[facet]||"";
			row.innerHTML=`<span>${f.facetJa}</span><b>${fv.toFixed(2)}</b><span class="small muted">${band(fv)}</span><div class="bar"><div style="width:${(fv-1)/4*100}%"></div></div>`;
			card.append(row);
		}
		box.append(card);
	}
}

function domainNarrative(d,v){
	const name=DOMAIN_DESC[d][0];
	const b=band(v);
	const texts={
		H:{
			"かなり高め":"対人操作や不公平な利益を避け、地位・ぜいたく・自己誇示を強く求めない側の回答が多くなっています。",
			"高め":"対人操作や不公平な利益を避け、地位や自己誇示を重視しにくい側へやや寄っています。",
			"中央付近":"正直さ・謙虚さに関する回答は一方向へ強く偏らず、下位尺度ごとの差を見る方が有用です。",
			"低め":"自己利益・地位・自己誇示を受け入れる側、または対人操作への抵抗が弱い側の回答がやや多くなっています。",
			"かなり低め":"自己利益・地位・自己誇示を受け入れる側、または対人操作への抵抗が弱い側の回答がかなり多くなっています。"
		},
		E:{
			"かなり高め":"危険への恐れ、不安、他者からの支え、情緒的な共感を感じやすい側の回答が多くなっています。",
			"高め":"不安や情緒的反応、他者との情緒的な結びつきを比較的感じやすい側へ寄っています。",
			"中央付近":"情動性は中央付近で、恐れ・不安・依存・情の深さのどこが高いかを分けて見る必要があります。",
			"低め":"不安や恐れに圧倒されにくく、情緒的に自立した側の回答がやや多くなっています。",
			"かなり低め":"不安や恐れに圧倒されにくく、他者への情緒的依存も少ない側の回答がかなり多くなっています。"
		},
		X:{
			"かなり高め":"自己表現、人前での大胆さ、社交性、活動的な活力の各面で外向的な回答が多くなっています。",
			"高め":"人との交流や自己表現、人前での行動に比較的積極的な側へ寄っています。",
			"中央付近":"外向性は中央付近で、社交性と大胆さ、活力などの内訳を見る方が実態に近そうです。",
			"低め":"人との交流や自己表現を控えめにし、一人または低刺激な環境を好む側へやや寄っています。",
			"かなり低め":"自己表現・社交・人前での大胆さ・活動的な活力を控えめにする側の回答が多くなっています。"
		},
		A:{
			"かなり高め":"対立した相手を許しやすく、批判や変更に柔軟で、怒りを長く持ちにくい側の回答が多くなっています。",
			"高め":"対立や他人の欠点に比較的穏やかに対応する側へ寄っています。",
			"中央付近":"協調性は中央付近で、許しやすさ・穏やかさ・柔軟さ・忍耐の差を見る方が有用です。",
			"低め":"他人の欠点や反論に厳しく反応したり、怒りや不満を保持したりする側へやや寄っています。",
			"かなり低め":"対立、批判、他人のミスなどに強く反応しやすい側の回答が多くなっています。"
		},
		C:{
			"かなり高め":"整理、努力の継続、細部への注意、計画性を強く重視する側の回答が多くなっています。",
			"高め":"計画的に取り組み、品質や細部を重視して課題を完了する側へ寄っています。",
			"中央付近":"勤勉性は中央付近で、整理・勤勉さ・完全主義・慎重さのどこが強いかを見る方が有用です。",
			"低め":"計画や細部の管理より柔軟さ・即興性を取りやすく、課題の継続や整理が弱めな側へ寄っています。",
			"かなり低め":"整理、努力の継続、細部への注意、慎重な計画をあまり重視しない側の回答が多くなっています。"
		},
		O:{
			"かなり高め":"美的経験、知的探究、新しい発想、慣習から外れる考え方に強く開かれた側の回答が多くなっています。",
			"高め":"新しい知識や発想、芸術的・非慣習的な経験へ比較的開かれた側へ寄っています。",
			"中央付近":"経験への開放性は中央付近で、美的感受性・探究心・創造性・非慣習性の差を見る方が有用です。",
			"低め":"新奇さや抽象的探究より、慣れた方法や具体的・実用的なものを選ぶ側へやや寄っています。",
			"かなり低め":"新奇な経験、抽象的探究、芸術的関心、非慣習的な考え方をあまり求めない側の回答が多くなっています。"
		}
	};
	return `${name}は ${v.toFixed(2)}（${b}）。${texts[d][b]}`;
}

function updateNarrative(){
	const sc=calc();
	const box=$("narrative");
	box.innerHTML="";
	const intro=document.createElement("p");
	intro.textContent="以下は今回の自己回答を機械的に要約したものです。高低は善悪や能力の優劣ではなく、回答傾向を表します。";
	box.append(intro);
	for(const d of DOMAIN_ORDER){
		const p=document.createElement("p");
		p.textContent=domainNarrative(d,sc.domains[d]);
		box.append(p);
	}
	const facetRows=Object.entries(sc.facets).map(([k,v])=>{
		const [d,f]=k.split(":");
		const item=ITEMS.find(x=>x.domain===d&&x.facet===f);
		return {d,f,name:item.facetJa,v};
	}).sort((a,b)=>b.v-a.v);
	const p=document.createElement("p");
	const high=facetRows.slice(0,3).map(x=>`${x.name} ${x.v.toFixed(2)}`).join("、");
	const low=facetRows.slice(-3).reverse().map(x=>`${x.name} ${x.v.toFixed(2)}`).join("、");
	p.textContent=`24下位尺度の中では、相対的に高いのは ${high}、低いのは ${low} です。総合因子だけでなく、この凹凸を見ると人物像を読み取りやすくなります。`;
	box.append(p);
}

function responseArray(map=answers){
	return ITEMS.filter(it=>map.has(it.id)).map(it=>({
		id:it.id,
		domain:it.domain,
		domain_name:it.domainJa,
		facet:it.facet,
		facet_name:it.facetJa,
		key:it.key,
		original:it.en,
		translation:it.ja,
		guidance:it.note||"",
		answer:map.get(it.id),
		answer_label:LABELS[map.get(it.id)-1],
		keyed_score:keyed(it,map.get(it.id))
	}));
}

function session(){
	const fullyAnswered=answers.size===ITEMS.length;
	const completed=fullyAnswered&&reviewComplete;
	const now=new Date().toISOString();
	const label=$("recordLabel").value.trim();
	const date=$("assessmentDate").value||todayLocal();
	return {
		schema:"ipip-hexaco-ja-result-v3",
		instrument:{
			name:"IPIP-HEXACO 240",
			item_schema:ITEM_DATA.schema,
			source:ITEM_DATA.source,
			translation:ITEM_DATA.translation
		},
		assessment:{
			label,
			date,
			started_at:startedAt,
			saved_at:now,
			completed_at:completed?now:null,
			status:completed?"completed":fullyAnswered?"reviewing":"in_progress"
		},
		progress:{
			position:pos,
			order,
			show_english:showEnglish,
			review:{
				complete:reviewComplete,
				pass:reviewPass,
				accepted:[...reviewAcceptedKeys]
			}
		},
		answers:Object.fromEntries([...answers.entries()].map(([k,v])=>[String(k),v])),
		responses:responseArray(),
		scores:fullyAnswered?calc():null
	};
}

function saveJson(prefix){
	const obj=session();
	const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
	const a=document.createElement("a");
	a.href=URL.createObjectURL(blob);
	const label=obj.assessment.label?obj.assessment.label.replace(/[\\/:*?"<>|]/g,"-")+"-":"";
	a.download=`${prefix}-${label}${obj.assessment.date}.json`;
	a.click();
	setTimeout(()=>URL.revokeObjectURL(a.href),1000);
	lastSave=new Date();
	if(!$("quiz").classList.contains("hidden"))renderProgress();
}

function readJson(file){
	return new Promise((resolve,reject)=>{
		const r=new FileReader();
		r.onload=()=>{ try{ resolve(JSON.parse(String(r.result))); }catch(e){ reject(e); } };
		r.onerror=reject;
		r.readAsText(file,"utf-8");
	});
}

function mapFromObject(o){
	const m=new Map();
	if(Array.isArray(o?.responses)){
		for(const r of o.responses){
			const id=Number(r.id),n=Number(r.answer);
			if(id>=1&&id<=240&&n>=1&&n<=5)m.set(id,n);
		}
	}
	if(o?.answers && typeof o.answers==="object"){
		for(const [k,v] of Object.entries(o.answers)){
			const id=Number(k),n=Number(v);
			if(id>=1&&id<=240&&n>=1&&n<=5)m.set(id,n);
		}
	}
	return m;
}

async function loadSession(file){
	try{
		const o=await readJson(file);
		const m=mapFromObject(o);
		if(!m.size)throw new Error("有効な回答がありません");
		answers=m;
		order=Array.isArray(o?.progress?.order)&&o.progress.order.length===240?o.progress.order.map(Number):Array.isArray(o.order)&&o.order.length===240?o.order.map(Number):ITEMS.map(x=>x.id);
		pos=Math.max(0,Math.min(239,Number(o?.progress?.position??o.position)||0));
		showEnglish=Boolean(o?.progress?.show_english??o.showEnglish);
		startedAt=o?.assessment?.started_at||null;
		reviewComplete=Boolean(o?.progress?.review?.complete);
		reviewPass=Number(o?.progress?.review?.pass)||0;
		reviewAcceptedKeys=new Set(Array.isArray(o?.progress?.review?.accepted)?o.progress.review.accepted:[]);
		$("recordLabel").value=o?.assessment?.label||"";
		$("assessmentDate").value=o?.assessment?.date||todayLocal();
		$("home").classList.add("hidden");
		if(answers.size===240){
			if(o?.assessment?.status==="completed" || reviewComplete){
				reviewComplete=true;
				showResults();
			}else{
				beginReview();
			}
		}else{
			$("quiz").classList.remove("hidden");
			render();
		}
	}catch(e){ alert("JSONを読み込めませんでした: "+e.message); }
}

function snapshotFromObject(o,fileName){
	const map=mapFromObject(o);
	if(map.size!==240)throw new Error("240問の完了済み回答ではありません");
	const scores=o?.scores?.domains?o.scores:calc(map);
	const label=o?.assessment?.label||"";
	const date=o?.assessment?.date||o?.savedAt?.slice?.(0,10)||"";
	const saved=o?.assessment?.completed_at||o?.assessment?.saved_at||o?.savedAt||"";
	return {label:label||date||fileName,date,saved,fileName,map,scores};
}

function currentSnapshot(){
	return {
		label:$("recordLabel").value.trim()||"今回",
		date:$("assessmentDate").value||todayLocal(),
		saved:new Date().toISOString(),
		fileName:"current",
		map:new Map(answers),
		scores:calc()
	};
}

async function loadComparisons(files){
	const loaded=[];
	for(const f of files){
		try{ loaded.push(snapshotFromObject(await readJson(f),f.name)); }
		catch(e){ alert(`${f.name}: ${e.message}`); }
	}
	comparisonSnapshots=loaded.sort((a,b)=>(a.date||a.saved).localeCompare(b.date||b.saved));
	updateComparison();
	updateAiPrompt();
}

function snapshotTitle(s){
	const parts=[];
	if(s.date)parts.push(s.date);
	if(s.label && s.label!==s.date)parts.push(s.label);
	return parts.join(" ")||s.fileName;
}

function updateComparison(){
	const box=$("compare");
	if(!box)return;
	if(!comparisonSnapshots.length){
		box.innerHTML='<p class="muted">比較用JSONを読み込むと、時系列で横に並べます。</p>';
		return;
	}
	const snaps=[...comparisonSnapshots,currentSnapshot()].sort((a,b)=>(a.date||a.saved).localeCompare(b.date||b.saved));
	const first=snaps[0],last=snaps[snaps.length-1];
	const domainDiffs=DOMAIN_ORDER.map(d=>({d,diff:last.scores.domains[d]-first.scores.domains[d]})).sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff));
	const changedAnswers=ITEMS.filter(it=>first.map.get(it.id)!==last.map.get(it.id)).length;
	const diffText=domainDiffs.slice(0,3).map(x=>`${x.d} ${x.diff>=0?"+":""}${x.diff.toFixed(2)}`).join("、");
	let html=`<div class="compareSummary"><b>${escapeHtml(snapshotTitle(first))} → ${escapeHtml(snapshotTitle(last))}</b>: 6因子で変化量が大きい順に ${diffText}。240問中 ${changedAnswers} 問で生の回答が変わっています。</div>`;
	html+='<h3>6因子</h3><div class="tableScroll"><table><thead><tr><th>因子</th>'+snaps.map(s=>`<th>${escapeHtml(snapshotTitle(s))}</th>`).join("")+'</tr></thead><tbody>';
	for(const d of DOMAIN_ORDER){
		html+=`<tr><td>${d} — ${escapeHtml(DOMAIN_DESC[d][0])}</td>`;
		for(const s of snaps)html+=`<td>${s.scores.domains[d].toFixed(2)}</td>`;
		html+="</tr>";
	}
	html+="</tbody></table></div>";

	const facets=[...new Set(ITEMS.map(x=>x.domain+":"+x.facet))];
	html+='<h3>24下位尺度</h3><div class="tableScroll"><table><thead><tr><th>尺度</th>'+snaps.map(s=>`<th>${escapeHtml(snapshotTitle(s))}</th>`).join("")+'</tr></thead><tbody>';
	for(const fk of facets){
		const [d,f]=fk.split(":");
		const item=ITEMS.find(x=>x.domain===d&&x.facet===f);
		html+=`<tr><td>${escapeHtml(item.facetJa)}</td>`;
		for(const s of snaps)html+=`<td>${s.scores.facets[fk].toFixed(2)}</td>`;
		html+="</tr>";
	}
	html+="</tbody></table></div>";

	html+='<h3>240問の回答</h3><p class="small muted">数値はその時点で選んだ生の回答です。逆転項目でも反転前の1〜5を表示します。</p><div class="tableScroll questionCompare"><table><thead><tr><th>ID / 質問</th>'+snaps.map(s=>`<th>${escapeHtml(snapshotTitle(s))}</th>`).join("")+'</tr></thead><tbody>';
	for(const it of ITEMS){
		html+=`<tr><td><b>${it.id}</b> ${escapeHtml(it.ja)}</td>`;
		for(let si=0;si<snaps.length;si++){
			const s=snaps[si],v=s.map.get(it.id);
			const prev=si>0?snaps[si-1].map.get(it.id):v;
			const cls=si>0&&v!==prev?"changedAnswer":"";
			html+=`<td class="${cls}" title="${v?escapeHtml(LABELS[v-1]):""}">${v??"—"}</td>`;
		}
		html+="</tr>";
	}
	html+="</tbody></table></div>";
	box.innerHTML=html;
}

function escapeHtml(s){
	return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function buildAiPrompt(){
	const current=currentSnapshot();
	const lines=[];
	lines.push("以下はIPIP-HEXACO 240項目を用いた自己回答データです。");
	lines.push("忖度なく、回答者に都合よく結論を調整せず、ただし高低を善悪や優劣として扱わずに分析してください。");
	lines.push("");
	lines.push("分析してほしい内容:");
	lines.push("- 6因子と24下位尺度から見える性格傾向");
	lines.push("- 総合因子だけでは隠れる、下位尺度どうしの特徴的な組み合わせ");
	lines.push("- 個別回答から見える一貫したパターン、または一見矛盾して見えるパターン");
	lines.push("- 対人関係、ストレス時、意思決定、仕事・学習、価値観に表れそうな傾向（データから言える範囲のみ）");
	lines.push("- 複数時点のデータがある場合は、単発の誤差を断定せず、どの傾向が安定し、どこが変化しているか");
	lines.push("- 断定できない点は推測と明示する");
	lines.push("- 医学的・精神医学的診断は行わない");
	lines.push("- この日本語版は独自翻訳であり、標準化済み日本語版ではないことを考慮する");
	lines.push("");
	const snaps=[...comparisonSnapshots,current].sort((a,b)=>(a.date||a.saved).localeCompare(b.date||b.saved));
	for(const s of snaps){
		lines.push("=== "+snapshotTitle(s)+" ===");
		lines.push("6因子:");
		for(const d of DOMAIN_ORDER)lines.push(`- ${d} ${DOMAIN_DESC[d][0]}: ${s.scores.domains[d].toFixed(2)}`);
		lines.push("24下位尺度:");
		for(const fk of [...new Set(ITEMS.map(x=>x.domain+":"+x.facet))]){
			const [d,f]=fk.split(":");
			const it=ITEMS.find(x=>x.domain===d&&x.facet===f);
			lines.push(`- ${it.facetJa}: ${s.scores.facets[fk].toFixed(2)}`);
		}
		lines.push("個別回答（生の1〜5。1=ほぼ当てはまらない、3=中間、5=かなり当てはまる）:");
		for(const it of ITEMS)lines.push(`${it.id}. [${it.domain}/${it.facetJa}] ${it.ja} => ${s.map.get(it.id)}`);
		lines.push("");
	}
	return lines.join("\n");
}

function updateAiPrompt(){ $("aiPrompt").value=buildAiPrompt(); }

async function copyPrompt(){
	updateAiPrompt();
	try{
		await navigator.clipboard.writeText($("aiPrompt").value);
		$("copyStatus").textContent="コピーしました。";
	}catch(_){
		$("aiPrompt").select();
		document.execCommand("copy");
		$("copyStatus").textContent="コピーしました。";
	}
}

init();
