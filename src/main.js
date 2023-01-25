

import {
    queryAPI,
    getSubDocsAPI,
    addblockAttrAPI,
    getblockAttrAPI,
    pushMsgAPI,
    getCurrentDocIdF,
    getCurrentWidgetId,
    getRiffDecks,
    addRiffCards
} from './API.js';
import { widgetDistinctSetting, language, setting } from './config.js';
import { isSafelyUpdate, isValidStr, transfromAttrToIAL } from './common.js';
import { MODES } from './modes.js';
let g_widget_attr = widgetDistinctSetting;
let g_widget_id = "";
let g_deck_list_temp;
let g_error_info_timeout;
let g_my_mode;
const WIDGET_ATTR_NAME = "custom-batch-add-riff-cards";

async function __init() {
    // 获取挂件id
    g_widget_id = getCurrentWidgetId();
    // 读取属性
    try {
        await getWidgetConfig();
    }catch (err) {
        console.error(err);
        pushError("读取挂件属性失败，如果刚插入挂件，请忽略此提示");
    }
    // 载入属性，创建对基本组件的信息获取和设定（设置基本组件的状态，绑定按钮事件）
    document.getElementById("start_add").onclick = doAdd;
    document.getElementById("mode_select").onchange = changeMode;
    document.getElementById("check_cards").onclick = async function (){await checkAdd();};
    document.getElementById("save_config").onclick = setWidgetConfig;
    // 设置界面文字
    document.getElementById("text_select_mode").innerText = language["ui_select_mode"];
    document.getElementById("text_select_deck").innerText = language["ui_select_deck"];
    // 载入牌组列表
    refreshDecksList();
    // 对应到模式
    for (let oneMode of MODES) {
        // console.log(oneMode.name);
        document.getElementById("mode_select").insertAdjacentHTML("beforeend", `<option value="${oneMode.id}">${language["mode" + oneMode.id]}</option>`);
    }
    document.getElementById("mode_select").value = g_widget_attr.current_mode.toString();
    // 初始化模式
    changeMode();
    // 载入模式内设定
    try {
        if (g_widget_attr[`mode_config_${g_widget_attr.current_mode}`] != undefined) {
            g_my_mode.load(g_widget_attr[`mode_config_${g_widget_attr.current_mode}`]);
        }
    }catch(err) {
        console.warn("载入模式设置时失败");
    }
    
}

/**
 * 刷新并重载牌组列表
 * 一并从g_widget_attr中载入选择的牌组，请注意刷新前保存用户界面设置
 */
async function refreshDecksList() {
    pushLog("载入卡包信息中...");
    let decksResponse = await getRiffDecks();
    let selectElem = document.getElementById("deck_choice");
    if (selectElem == null || selectElem == undefined) return;
    selectElem.innerHTML = "";
    for (let oneDeckResponse of decksResponse) {
        let oneDeckInputElem = document.createElement("option");
        oneDeckInputElem.setAttribute("value", oneDeckResponse.id);
        oneDeckInputElem.innerText = `${oneDeckResponse.name} (${oneDeckResponse.size})`;
        selectElem.insertAdjacentElement("beforeend", oneDeckInputElem);
    }
    g_deck_list_temp = decksResponse;
    // 载入牌组选择
    console.log(decksResponse);
    document.getElementById("deck_choice").value = g_widget_attr.target_deck_id;
    pushLog("成功载入卡包信息");
    // setTimeout(()=>{console.log(document.decklist.select_deck.checked)}, 10000);
}

/**
 * 模式切换
 */
function changeMode() {
    g_my_mode?.destory();
    g_my_mode = null;
    g_widget_attr.current_mode = document.getElementById("mode_select").value;
    for (let oneMode of MODES) {
        if (oneMode.id.toString() == g_widget_attr.current_mode) {
            g_my_mode = new oneMode();
            break;
        }
    }
    document.getElementById("mode_config_container").innerHTML = "";
    document.getElementById("mode_intro_container").innerHTML = "";
    g_my_mode = g_my_mode ?? new MODES[0]();
    g_my_mode.init();
    let infoElem = document.getElementById("mode_intro_container");
    infoElem.innerHTML = language[`mode${g_my_mode.id}_introduction`];
    if (g_widget_attr[`mode_config_${g_widget_attr.current_mode}`] != undefined) {
        g_my_mode.load(g_widget_attr["mode_config_" + g_my_mode.id]);
    }
}

/**
 * 保存挂件设置到属性
 */
async function setWidgetConfig() {
    // 补充或修改模式内部设置信息
    let modeConfig = g_my_mode.save();
    if (modeConfig != undefined && modeConfig != null) {
        g_widget_attr["mode_config_" + g_my_mode.id] = modeConfig;
    }
    let attrString = JSON.stringify(g_widget_attr);
    let postBody = {};
    postBody[WIDGET_ATTR_NAME] = attrString;
    let response = await addblockAttrAPI(postBody, g_widget_id);
    if (response != 0) {
        throw Error(language["writeAttrFailed"]);
    }
    console.log("写入挂件属性", attrString);
}

/**
 * 从属性中读取挂件设置
 * @returns 
 */
async function getWidgetConfig() {
    let response = await getblockAttrAPI(g_widget_id);
    let attrObject = {};
    if (WIDGET_ATTR_NAME in response.data) {
        try {
            attrObject = JSON.parse(response.data[WIDGET_ATTR_NAME].replaceAll("&quot;", "\""));
        } catch (err) {
            console.warn("解析挂件属性json失败，将按默认值新建配置记录", err.message);
            return;
        }
        Object.assign(g_widget_attr, attrObject);
    }
    if (!("id" in response.data)) {
        throw Error(language["getAttrFailed"]);
    }
}

function getDocId() {

}

function pushLog(text = "") {
    document.getElementById("log_info").innerText = text;
}

function pushError(text = "", timeout = 7000) {
    clearTimeout(g_error_info_timeout);
    document.getElementById("error_info").innerText = text;
    if (text != "" && timeout > 0) {
        console.log("setTimeout");
        setTimeout(()=>{pushError("", 0)}, timeout);
    }
}

/**
 * 
 * @param {*} mouseEvent 
 */
function removeOneResult(mouseEvent) {
    console.log(mouseEvent);
    console.log(this);
    console.log(this.parentNode.parentNode);
    let tobeRemove = this.parentNode.parentNode.firstChild.innerText;
    pushLog(`移除${this.parentNode.parentNode.firstChild.innerText}，剩余${document.getElementById("preview_table").childElementCount - 2}`);
    document.getElementById("preview_table").removeChild(this.parentNode.parentNode);
    
}

/**
 * 
 */
function goToOneBlockResult(mouseEvent) {
    let id = this.innerText;
    // 处理笔记本等无法跳转的情况
    if (!isValidStr(id)) return;
    let virtualLink =  window.parent.document.createElement("span");
    virtualLink.setAttribute("data-type","block-ref")
    virtualLink.setAttribute("data-id",id)
    virtualLink.style.display = "none";//不显示虚拟链接，防止视觉干扰
    let tempAddTarget = window.parent.document.querySelector(".protyle-wysiwyg div[data-node-id] div[contenteditable]")
    tempAddTarget.appendChild(virtualLink);
    virtualLink.click();
    virtualLink.remove();

}

/**
 * 预览添加信息
 */
async function checkAdd() {
    // 获取用户的选择（牌组）
    g_widget_attr.target_deck_id = document.getElementById("deck_choice").value;
    // 刷新牌组列表，确保添加卡牌计数正确
    await refreshDecksList();
    let scanAttr = {
        userSelectDeckInfo: null,
        userSelectDeckId: g_widget_attr.target_deck_id,
        allDeckInfo: g_deck_list_temp,
        currentDocId: null,
        openedDocIds: null,
    };
    scanAttr.currentDocId = await getCurrentDocIdF();
    // 获取选择的牌组详情
    for (let oneDeckInfo of g_deck_list_temp) {
        if (oneDeckInfo.id == g_widget_attr.target_deck_id) {
            scanAttr.userSelectDeckInfo = oneDeckInfo;
            break;
        }
    }
    
    let blockInfos, deckId;
    // TODO: 可选择的传入项目：目前选择的牌组id；所有牌组信息；所在文档（正在打开的文档）；所有已打开的文档
    try{
        [blockInfos, deckId] = await g_my_mode.scan(scanAttr);
    }catch(err) {
        console.warn(err);
        pushError(err.message);
        pushLog("生成预览时发生错误");
        return;
    }
    

    // 初始化表格
    let tableElem = document.getElementById("preview_table");
    // tableElem.innerHTML = "";
    tableElem.innerHTML = `<tr>
    <th>id</th>
    <th>内容预览</th>
    <th>操作</th>
</tr>`;
    for (let i = 0; i < blockInfos.length; i++) {
        let oneRowElem = document.createElement("tr");
        let idColElem = document.createElement("td");
        let contentColElem = document.createElement("td");
        let opColElem = document.createElement("td");
        let btnElem = document.createElement("span");
        
        idColElem.innerText = blockInfos[i].id;
        idColElem.classList.add("to-be-add-block-id");
        idColElem.onclick = goToOneBlockResult;
        contentColElem.innerText = blockInfos[i].content;
        btnElem.innerText = "移除";
        btnElem.onclick = removeOneResult;
        opColElem.appendChild(btnElem);

        oneRowElem.appendChild(idColElem);
        oneRowElem.appendChild(contentColElem);
        oneRowElem.appendChild(opColElem);

        tableElem.appendChild(oneRowElem);
        // tableElem.insertAdjacentHTML("beforeend", `<tr>
        // <td>${blockInfos[i].id}</td>
        // <td>${blockInfos[i].content}</td>
        // <td></td>
        // </tr>`);
    }
    document.getElementById("deck_choice").value = deckId;
    pushLog(`待添加卡牌预览已加载完成，检索到${blockInfos.length}个匹配块`);
    setWidgetConfig();
}

async function doAdd() {
    // 获取用户的选择（牌组）
    g_widget_attr.target_deck_id = document.getElementById("deck_choice").value;
    let deckId = g_widget_attr.target_deck_id;
    // 刷新牌组列表，确保添加卡牌计数正确
    await refreshDecksList();
    // 获取预览信息
    let blockIds = [].map.call(document.getElementsByClassName("to-be-add-block-id"), (value) => {
        return value.innerText;
    });

    if (!isValidStr(blockIds) || blockIds.length <= 0) {
        pushLog(language["hint_check_preview_first"]);
        return;
    }
    // 寻找卡包信息
    let selectDeckInfo = null;
    for (let i = 0; i < g_deck_list_temp.length; i++) {
        if (g_deck_list_temp[i].id == deckId) {
            selectDeckInfo = g_deck_list_temp[i];
            break;
        }
    }
    if (selectDeckInfo == null) {
        pushLog("错误，指定的卡包不存在");
        return;
    }
    
    console.log("将添加的块ids", blockIds);
    // return;
    // 执行加入闪卡
    let afterAddSize = await addRiffCards(blockIds, deckId);
    pushLog(`【添加成功】请求添加闪卡${blockIds.length}张，实际插入闪卡${afterAddSize - selectDeckInfo.size}张；`);
    
    console.log(blockIds);
}

/*
// oldVersion
async function doAdd() {
    pushLog("开始添加");
    // 获取用户的选择（牌组）
    g_widget_attr.target_deck_id = document.getElementById("deck_choice").value;
    // 刷新牌组列表，确保添加卡牌计数正确
    await refreshDecksList();
    let scanAttr = {
        userSelectDeckInfo: null,
        userSelectDeckId: g_widget_attr.target_deck_id,
        allDeckInfo: g_deck_list_temp,
        currentDocId: null,
        openedDocIds: null,
    };
    scanAttr.currentDocId = await getCurrentDocIdF();
    // 获取选择的牌组详情
    for (let oneDeckInfo of g_deck_list_temp) {
        if (oneDeckInfo.id == g_widget_attr.target_deck_id) {
            scanAttr.userSelectDeckInfo = oneDeckInfo;
            break;
        }
    }
    
    
    // TODO: 可选择的传入项目：目前选择的牌组id；所有牌组信息；所在文档（正在打开的文档）；所有已打开的文档
    let [blockInfos, deckId] = await g_my_mode.scan(scanAttr);
    console.log("scan返回", blockInfos, deckId);
    // return;
    if (!isValidStr(blockInfos) || blockInfos.length <= 0) {
        pushLog(language["hint_block_not_found"]);
        return;
    }
    if (!isValidStr(deckId)) {
        pushLog(language["hint_deck_not_selected"]);
        return;
    }
    let blockIds = blockInfos.map((value) => {
        return value.id;
    });
    console.log("提取id", blockIds);
    // 执行加入闪卡
    return;
    let afterAddSize = await addRiffCards(blockIds, deckId);
    pushLog(`【添加成功】实际插入卡牌数：${afterAddSize - scanAttr.userSelectDeckInfo.size}；获取到符合条件的块数：${blockIds.length}；`);
    setWidgetConfig();
}
*/


__init();