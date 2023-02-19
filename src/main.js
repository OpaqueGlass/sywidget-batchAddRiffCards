

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
import { showFloatWnd } from './ref-utils.js';
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
    document.getElementById("show_mode_intro").onclick = modeIntroDisplayer;
    document.getElementById("auto_match_deck").onchange = (event) => {g_widget_attr.auto_match_deck = event.target.checked;};
    // 设置界面文字
    document.getElementById("text_select_mode").innerText = language["ui_select_mode"];
    document.getElementById("text_select_deck").innerText = language["ui_select_deck"];
    document.getElementById("check_cards").title = language["ui_btn_preview"];
    document.getElementById("start_add").title = language["ui_btn_add"];
    document.getElementById("save_config").title = language["ui_btn_save_setting"];
    document.getElementById("show_mode_intro").innerText = language["ui_show_mode_intro"];
    document.getElementById("text_auto_match_deck").innerText = language["ui_enable_match_deck"];
    // 载入牌组列表
    refreshDecksList();
    // 对应到模式
    for (let oneMode of MODES) {
        // console.log(oneMode.name);
        document.getElementById("mode_select").insertAdjacentHTML("beforeend", `<option value="${oneMode.id}">${language["mode" + oneMode.id]}</option>`);
    }
    document.getElementById("mode_select").value = g_widget_attr.current_mode.toString();
    document.getElementById("auto_match_deck").checked = g_widget_attr["auto_match_deck"];
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
    pushLogF(language["info_loading_decks_info"]);
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
    // console.debug(decksResponse);
    document.getElementById("deck_choice").value = g_widget_attr.target_deck_id;
    pushLogF(language["info_loaded_decks_info"]);
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
    // 适配深色模式
    if (window.top.siyuan.config.appearance.mode == 1) {
        document.getElementsByTagName("body")[0].style.color = "#c9d1d9";
        document.querySelectorAll("select, input, textarea").forEach((elem)=>{
            elem.classList.add("button_dark");
        });
    }
}

/**
 * 保存挂件设置到属性
 */
async function setWidgetConfig() {
    if (!isValidStr(g_widget_id)) return;
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
    console.debug("写入挂件属性", attrString);
}

/**
 * 从属性中读取挂件设置
 * @returns 
 */
async function getWidgetConfig() {
    if (!isValidStr(g_widget_id)) return;
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
        throw Error(language["error_getAttrFailed"]);
    }
}

function getOpenDocIds() {
    let openedDocIds = new Array();
    [].forEach.call(window.top.document.querySelectorAll(".protyle.fn__flex-1 .protyle-background"), (elem)=>{
        if (isValidStr(elem.getAttribute("data-node-id"))) {
            openedDocIds.push(elem.getAttribute("data-node-id"));
        }
    });
    console.debug("已开启文档定位元素", window.top.document.querySelectorAll(".protyle.fn__flex-1 .protyle-background"));
    console.debug("已开启文档id", openedDocIds);
    return openedDocIds;
}

function pushLogF(text = "", ...theArgs) {
    for (const arg of theArgs) {
        text = text.replace("@@", arg);
    }
    let logAreaElem = document.getElementById("log_info");
    logAreaElem.value = `${logAreaElem.value}\n${new Date().toLocaleTimeString()} I${text}`;
    logAreaElem.scrollTop = logAreaElem.scrollHeight;
}

function pushError(text = "", timeout = 7000) {
    clearTimeout(g_error_info_timeout);
    document.getElementById("error_info").innerText = text;
    if (text != "" && timeout > 0) {
        setTimeout(()=>{pushError("", 0)}, timeout);
    }
}

function modeIntroDisplayer() {
    let elem = document.getElementById("show_mode_intro");
    let containerElem = document.getElementById("mode_intro_container");
    if (containerElem.style.display == "none") {
        containerElem.style.display = "block";
        elem.innerText = language["ui_hide_mode_intro"];
    }else{
        containerElem.style.display = "none";
        elem.innerText = language["ui_show_mode_intro"];
    }
}

/**
 * 移除预览的一个结果
 * @param {*} mouseEvent 
 */
function removeOneResult(mouseEvent) {
    let tobeRemove = this.parentNode.parentNode.firstChild.innerText;
    pushLogF(language["info_remove_block"], this.parentNode.parentNode.firstChild.innerText, document.getElementById("preview_table").childElementCount - 2);
    document.getElementById("preview_table").removeChild(this.parentNode.parentNode);
    
}

/**
 * 
 */
function goToOneBlockResult(mouseEvent) {
    let id = this.innerText;
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

function popOneBlockResult(mouseEvent) {
    if (mouseEvent.buttons == 2) {
        let id = this.innerText;
        // 处理笔记本等无法跳转的情况
        if (!isValidStr(id)) return;
        mouseEvent.target.setAttribute("data-node-id", id);
        showFloatWnd(mouseEvent);
    }
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
        currentDocBlockInfo: null,
        openedDocIds: null,
    };
    scanAttr.currentDocId = await getCurrentDocIdF();
    scanAttr.currentDocBlockInfo = await queryAPI(`SELECT * FROM blocks WHERE id = '${scanAttr.currentDocId}' and type = 'd'`);
    if (scanAttr.currentDocBlockInfo.length != 1) {
        console.warn("当前文档id可能定位出错");
    }else{
        scanAttr.currentDocBlockInfo = scanAttr.currentDocBlockInfo[0];
    }
    scanAttr.openedDocIds = getOpenDocIds();
    // 获取选择的牌组详情
    for (let oneDeckInfo of g_deck_list_temp) {
        if (oneDeckInfo.id == g_widget_attr.target_deck_id) {
            scanAttr.userSelectDeckInfo = oneDeckInfo;
            break;
        }
    }
    console.debug("获取基本信息", scanAttr);
    let blockInfos, deckId;
    // 传入项目：目前选择的牌组id；所有牌组信息；所在文档（正在打开的文档）；所有已打开的文档
    try{
        [blockInfos, deckId] = await g_my_mode.scan(scanAttr);
    }catch(err) {
        console.warn(err);
        pushError(err.message);
        pushLogF(language["error_gen_preview_failed"]);
        return;
    }
    

    // 初始化表格
    let tableElem = document.getElementById("preview_table");
    // tableElem.innerHTML = "";
    tableElem.innerHTML = `<tr>
    <th>${language["ui_table_id"]}</th>
    <th>${language["ui_table_content_preview"]}</th>
    <th>${language["ui_table_operation"]}</th>
</tr>`;
    let actualAddCount = 0;
    for (let i = 0; i < blockInfos.length; i++) {
        if (!("id" in blockInfos[i])) {
            continue;
        }
        let oneRowElem = document.createElement("tr");
        let idColElem = document.createElement("td");
        let contentColElem = document.createElement("td");
        let opColElem = document.createElement("td");
        let btnElem = document.createElement("span");
        
        idColElem.innerText = blockInfos[i].id;
        idColElem.classList.add("to-be-add-block-id");
        idColElem.onclick = goToOneBlockResult;
        idColElem.onmousedown = popOneBlockResult;
        contentColElem.innerText = blockInfos[i].content;
        btnElem.innerText = language["ui_table_op_delete"];
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
        actualAddCount++;
    }
    if (isValidStr(deckId)) {
        document.getElementById("deck_choice").value = deckId;
    }else if (g_widget_attr["auto_match_deck"]){
        // TODO: 自动判断卡包
        deckId = await matchDeckByDocPath(scanAttr.currentDocId);
        if (isValidStr(deckId)) {
            document.getElementById("deck_choice").value = deckId;
            pushLogF("自动修改了对应卡包");
        }
    }
    pushLogF(language["info_preview_done"], actualAddCount);
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
        pushLogF(language["hint_check_preview_first"]);
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
        pushLogF(language["hint_deck_not_exist"]);
        return;
    }
    
    console.log("将添加的块ids", blockIds);
    // return;
    // 执行加入闪卡
    let afterAddSize = await addRiffCards(blockIds, deckId);
    pushLogF(language["info_batch_add_done"], blockIds.length, afterAddSize - selectDeckInfo.size);
    
    console.log(blockIds);
}

/**
 * 根据文档路径判断卡包
 * @param {*} docId 
 */
async function matchDeckByDocPath(docId) {
    let queryCurDoc = await queryAPI(`SELECT * FROM blocks WHERE id = '${docId}'`);
    let curDocHPath = queryCurDoc[0].hpath;
    let folderItemOfHPath = curDocHPath.split("/");
    // 路径联合匹配
    for (let oneDeckInfo of g_deck_list_temp) {
        if (oneDeckInfo.name.includes("/")) {
            if (curDocHPath.indexOf(oneDeckInfo.name) != -1) {
                pushLogF("路径联合匹配到卡包");
                return oneDeckInfo.id;
            }
        }
    }
    
    // 路径单项匹配
    for (let i = folderItemOfHPath.length - 1; i > 0; i--) {
        for (let oneDeckInfo of g_deck_list_temp) {
            let splitedDeckName = oneDeckInfo.name.split("/");
            for (let oneSpliteDeckName of splitedDeckName) {
                if (isValidStr(oneSpliteDeckName) && folderItemOfHPath[i].indexOf(oneSpliteDeckName) != -1) {
                    pushLogF("路径单项匹配到卡包[@@,@@]", oneSpliteDeckName, folderItemOfHPath[i]);
                    return oneDeckInfo.id;
                }
            }
        }
    }
    pushLogF("没有匹配的卡包");
    return undefined;
}

/*
// oldVersion
async function doAdd() {
    pushLogF("开始添加");
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
        pushLogF(language["hint_block_not_found"]);
        return;
    }
    if (!isValidStr(deckId)) {
        pushLogF(language["hint_deck_not_selected"]);
        return;
    }
    let blockIds = blockInfos.map((value) => {
        return value.id;
    });
    console.log("提取id", blockIds);
    // 执行加入闪卡
    return;
    let afterAddSize = await addRiffCards(blockIds, deckId);
    pushLogF(`【添加成功】实际插入卡牌数：${afterAddSize - scanAttr.userSelectDeckInfo.size}；获取到符合条件的块数：${blockIds.length}；`);
    setWidgetConfig();
}
*/


__init();