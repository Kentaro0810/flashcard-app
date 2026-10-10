const STORAGE_KEY = "flashcard-app-data-v1";
const totalCount = document.getElementById("totalCount");
const masteredCount = document.getElementById("masteredCount");
const weakCount = document.getElementById("weakCount");
const cardList = document.getElementById("cardList");
const libraryEmpty = document.getElementById("libraryEmpty");
const searchInput = document.getElementById("searchInput");
const libraryCategory = document.getElementById("libraryCategory");
const studyCategory = document.getElementById("studyCategory");
const studyMode = document.getElementById("studyMode");
const studyEmpty = document.getElementById("studyEmpty");
const studySession = document.getElementById("studySession");
const flashcard = document.getElementById("flashcard");
const cardSideLabel = document.getElementById("cardSideLabel");
const cardContent = document.getElementById("cardContent");
const sessionProgress = document.getElementById("sessionProgress");
const sessionCategory = document.getElementById("sessionCategory");
const answerActions = document.getElementById("answerActions");
const sessionComplete = document.getElementById("sessionComplete");
const sessionResult = document.getElementById("sessionResult");
const dialog = document.getElementById("cardDialog");
const cardForm = document.getElementById("cardForm");
const cardId = document.getElementById("cardId");
const questionInput = document.getElementById("questionInput");
const answerInput = document.getElementById("answerInput");
const categoryInput = document.getElementById("categoryInput");
const categorySuggestions = document.getElementById("categorySuggestions");
const dialogTitle = document.getElementById("dialogTitle");
const importInput = document.getElementById("importInput");
const statusMessage = document.getElementById("statusMessage");

let cards = loadCards();
let sessionCards = [];
let sessionIndex = 0;
let sessionCorrect = 0;
let showingAnswer = false;
let statusTimer;

function loadCards() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch { return []; }
}
function saveCards() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); }
function categories() { return [...new Set(cards.map(card => card.category.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ja")); }
function showStatus(message,error=false){clearTimeout(statusTimer);statusMessage.textContent=message;statusMessage.style.color=error?"#dc2626":"#15803d";statusTimer=setTimeout(()=>statusMessage.textContent="",3500)}
function shuffle(array){const copy=[...array];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}

function updateCategoryOptions(){
  const selectedLibrary=libraryCategory.value; const selectedStudy=studyCategory.value;
  const options=categories();
  libraryCategory.innerHTML='<option value="all">すべてのカテゴリー</option>';
  studyCategory.innerHTML='<option value="all">すべてのカテゴリー</option>';
  categorySuggestions.replaceChildren();
  options.forEach(category=>{
    [libraryCategory,studyCategory].forEach(select=>{const option=document.createElement("option");option.value=category;option.textContent=category;select.append(option)});
    const suggestion=document.createElement("option");suggestion.value=category;categorySuggestions.append(suggestion);
  });
  if([...libraryCategory.options].some(o=>o.value===selectedLibrary))libraryCategory.value=selectedLibrary;
  if([...studyCategory.options].some(o=>o.value===selectedStudy))studyCategory.value=selectedStudy;
}

function renderSummary(){
  totalCount.textContent=`${cards.length}枚`;
  masteredCount.textContent=`${cards.filter(card=>card.status==="mastered").length}枚`;
  weakCount.textContent=`${cards.filter(card=>card.status==="weak").length}枚`;
  studyEmpty.classList.toggle("hidden",cards.length!==0);
}

function resultLabel(status){return status==="mastered"?"覚えた":status==="weak"?"苦手":"未回答"}
function renderLibrary(){
  const query=searchInput.value.trim().toLowerCase(); const category=libraryCategory.value;
  const filtered=cards.filter(card=>(category==="all"||card.category===category)&&(!query||card.question.toLowerCase().includes(query)||card.answer.toLowerCase().includes(query)));
  cardList.replaceChildren();
  filtered.forEach(card=>{
    const item=document.createElement("article");item.className="library-item";
    const body=document.createElement("div");
    const cat=document.createElement("span");cat.className="category";cat.textContent=card.category;
    const question=document.createElement("h3");question.textContent=card.question;
    const answer=document.createElement("p");answer.className="answer-preview";answer.textContent=`答え：${card.answer}`;
    const result=document.createElement("span");result.className=`result-chip ${card.status||""}`;result.textContent=resultLabel(card.status);
    body.append(cat,question,answer,result);
    const actions=document.createElement("div");actions.className="item-actions";
    const edit=document.createElement("button");edit.className="small-button";edit.type="button";edit.textContent="編集";edit.addEventListener("click",()=>openDialog(card));
    const remove=document.createElement("button");remove.className="small-button delete-button";remove.type="button";remove.textContent="削除";remove.addEventListener("click",()=>deleteCard(card.id));
    actions.append(edit,remove);item.append(body,actions);cardList.append(item);
  });
  libraryEmpty.classList.toggle("hidden",filtered.length!==0);
}

function render(){updateCategoryOptions();renderSummary();renderLibrary()}
function openDialog(card=null){cardForm.reset();cardId.value=card?.id||"";questionInput.value=card?.question||"";answerInput.value=card?.answer||"";categoryInput.value=card?.category||"";dialogTitle.textContent=card?"カードを編集":"カードを追加";dialog.showModal();setTimeout(()=>questionInput.focus(),50)}
function closeDialog(){dialog.close()}
function saveCard(event){event.preventDefault();const question=questionInput.value.trim(),answer=answerInput.value.trim(),category=categoryInput.value.trim();if(!question||!answer||!category)return;const existing=cards.find(card=>card.id===cardId.value);if(existing)Object.assign(existing,{question,answer,category});else cards.push({id:`card-${Date.now()}-${Math.random().toString(16).slice(2)}`,question,answer,category,status:"unseen",createdAt:new Date().toISOString()});saveCards();closeDialog();render()}
function deleteCard(id){const card=cards.find(item=>item.id===id);if(!card||!confirm(`「${card.question}」を削除しますか？`))return;cards=cards.filter(item=>item.id!==id);saveCards();render()}

function getStudyCards(){const category=studyCategory.value,mode=studyMode.value;return cards.filter(card=>(category==="all"||card.category===category)&&(mode==="all"||card.status===mode))}
function startStudy(){const selected=getStudyCards();if(!selected.length){showStatus("条件に合うカードがありません。",true);return}sessionCards=shuffle(selected);sessionIndex=0;sessionCorrect=0;studyEmpty.classList.add("hidden");studySession.classList.remove("hidden");sessionComplete.classList.add("hidden");flashcard.classList.remove("hidden");showCurrentCard()}
function showCurrentCard(){const card=sessionCards[sessionIndex];showingAnswer=false;flashcard.classList.remove("answer");cardSideLabel.textContent="問題";cardContent.textContent=card.question;flashcard.querySelector("small").textContent="タップして答えを見る";sessionProgress.textContent=`${sessionIndex+1} / ${sessionCards.length}`;sessionCategory.textContent=card.category;answerActions.classList.add("hidden")}
function flipCard(){if(showingAnswer||sessionComplete.classList.contains("hidden")===false)return;showingAnswer=true;const card=sessionCards[sessionIndex];flashcard.classList.add("answer");cardSideLabel.textContent="答え";cardContent.textContent=card.answer;flashcard.querySelector("small").textContent="覚えたか選んでください";answerActions.classList.remove("hidden")}
function answerCard(correct){const sessionCard=sessionCards[sessionIndex];const original=cards.find(card=>card.id===sessionCard.id);if(original)original.status=correct?"mastered":"weak";if(correct)sessionCorrect++;saveCards();sessionIndex++;if(sessionIndex>=sessionCards.length)finishSession();else showCurrentCard();renderSummary();renderLibrary()}
function finishSession(){flashcard.classList.add("hidden");answerActions.classList.add("hidden");sessionComplete.classList.remove("hidden");sessionResult.textContent=`正解 ${sessionCorrect} / ${sessionCards.length}`}

function exportData(){const payload={version:1,cards,exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`flashcards-backup-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(url);showStatus("バックアップを書き出しました。")}
async function importData(event){const file=event.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!parsed||!Array.isArray(parsed.cards))throw new Error("invalid");if(!confirm("現在のカードをバックアップで上書きしますか？"))return;cards=parsed.cards;saveCards();render();showStatus("バックアップを読み込みました。")}catch{showStatus("このファイルは読み込めません。",true)}finally{importInput.value=""}}
function resetResults(){if(!cards.length)return showStatus("カードがありません。",true);if(!confirm("すべてのカードを未回答に戻しますか？"))return;cards.forEach(card=>card.status="unseen");saveCards();render();showStatus("学習結果をリセットしました。")}
function resetAll(){if(!cards.length)return showStatus("削除するカードがありません。",true);if(!confirm("すべてのカードと学習結果を削除しますか？"))return;cards=[];saveCards();studySession.classList.add("hidden");render();showStatus("すべてのデータを削除しました。")}

document.getElementById("openAddButton").addEventListener("click",()=>openDialog());
document.getElementById("closeDialogButton").addEventListener("click",closeDialog);
document.getElementById("cancelButton").addEventListener("click",closeDialog);
document.getElementById("startStudyButton").addEventListener("click",startStudy);
document.getElementById("correctButton").addEventListener("click",()=>answerCard(true));
document.getElementById("incorrectButton").addEventListener("click",()=>answerCard(false));
document.getElementById("restartButton").addEventListener("click",startStudy);
document.getElementById("exportButton").addEventListener("click",exportData);
document.getElementById("resetResultsButton").addEventListener("click",resetResults);
document.getElementById("resetAllButton").addEventListener("click",resetAll);
flashcard.addEventListener("click",flipCard);cardForm.addEventListener("submit",saveCard);importInput.addEventListener("change",importData);searchInput.addEventListener("input",renderLibrary);libraryCategory.addEventListener("change",renderLibrary);dialog.addEventListener("click",event=>{if(event.target===dialog)closeDialog()});
render();
