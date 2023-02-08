import { getCurrentDocIdF, queryAPI } from "./API.js";
import { language, setting } from "./config.js";
import { tabHandler } from "./uncommon.js";

class ModeExample {
    static id = -1;
    id = -1;
    // 模式所需要的初始化工作，包括向模式设置区
    init() {
        console.log("INIT");
    }
    // 移除模式时所做的工作
    destory() {
        
    }
    // 载入模式内部设置
    load(modeSettings) {

    }
    // 保存模式内部设置，请返回一个对象，由挂件保存
    save() {
        return undefined;
    }
    // 执行，请返回要被创建为闪卡的块id数组
    async scan(scanAttr) {
        return [["20230201214304-2dllohm"], undefined];
    }
}

class HeadingMode extends ModeExample{
    static id = 1;
    id = 1;
    modeSettings = {};
    // 模式所需要的初始化工作，包括向模式设置区
    init() {
        let containerElem = document.getElementById("mode_config_container");
        containerElem.innerHTML = `<span>${language["mode1_select_heading"]}</span><select id="mode_heading">
        <option value="h1">H1</option>
        <option value="h2">H2</option>
        <option value="h3">H3</option>
        <option value="h4">H4</option>
        <option value="h5">H5</option>
        <option value="h6">H6</option>
        </select>
        <br/>
        <span>${language["mode1_include_child_docs"]}</span><input type="checkbox" id="mode_include_child_doc" />`;
        console.log("INIT标题模式");
    }
    // 移除模式时所做的工作
    destory() {
        
    }
    // 载入模式内部设置
    load(modeSettings) {
        document.getElementById("mode_heading").value = modeSettings.mode_heading
    }
    // 保存模式内部设置，请返回一个对象，由挂件保存
    save() {
        return {
            mode_heading: document.getElementById("mode_heading").value
        }
    }
    // 执行，请返回要被创建为闪卡的块id数组
    async scan(scanAttr) {
        let parentDistinct = document.getElementById("mode_include_child_doc").checked ? "%" : ".sy";
        let queryResult = await queryAPI(`select * from blocks where path like '%${scanAttr.currentDocId}${parentDistinct}' and type = 'h' and subtype = '${document.getElementById("mode_heading").value}';`);
        // let result = queryResult.map((curValue, index) => {
        //     return curValue.id;
        // });
        return [queryResult, undefined];
    }
}

class SuperBlockMode extends ModeExample {
    static id = 2;
    id = 2;
    // 模式所需要的初始化工作，包括向模式设置区
    init() {
        let containerElem = document.getElementById("mode_config_container");
        containerElem.innerHTML = `
        <span>${language["mode1_include_child_docs"]}</span><input type="checkbox" id="mode_include_child_doc" />
        <span>${language["mode2_match_qa_pattern"]}</span><input type="checkbox" id="mode_match_qa_pattern" />
        `;
        console.log("INIT超级块模式");
    }
    // 执行，请返回要被创建为闪卡的块信息数组
    async scan(scanAttr) {
        let parentDistinct = document.getElementById("mode_include_child_doc").checked ? "%" : ".sy";
        let qaPatternDistince = document.getElementById("mode_match_qa_pattern").checked ? `AND content regexp '${setting.in_mode_setting.mode6_qa_pattern}'` : "";
        let queryResult = await queryAPI(`select * from blocks where path like '%${scanAttr.currentDocId}${parentDistinct}' and type = 's' ${qaPatternDistince};`);
        return [queryResult, undefined];
    }
}

class SQLMode extends ModeExample {
    static id = 3;
    id = 3;
    // 模式所需要的初始化工作，包括向模式设置区
    init() {
        console.log("INITSQL模式");
        let containerElem = document.getElementById("mode_config_container");
        containerElem.innerHTML = `<textarea id="mode_user_sql" rows="7" cols="66" placeholder="在此输入SQL / Input SQL here"></textarea>`;
        document.getElementById("mode_user_sql").addEventListener("keydown", tabHandler);
    }
    // 移除模式时所做的工作
    destory() {
        document.getElementById("mode_user_sql").removeEventListener("keydown", tabHandler);
    }
    // 载入模式内部设置
    load(modeSettings) {
        document.getElementById("mode_user_sql").value = modeSettings.sql_stmt;
    }
    // 保存模式内部设置，请返回一个对象，由挂件保存
    save() {
        return {
            "sql_stmt": document.getElementById("mode_user_sql").value
        };
    }
    // 执行，请返回要被创建为闪卡的块信息数组
    async scan(scanAttr) {
        let sqlStmt = document.getElementById("mode_user_sql").value;
        sqlStmt = sqlStmt.replace(new RegExp("@CUR_DOC@", "g"), scanAttr.currentDocId);
        sqlStmt = sqlStmt.replace(new RegExp("@ALL_OPEN_DOC@", "g")
                // 在RegExp初始化中，使用字符串初始化时，注意正则表达式中的\应当在字符串中转义（用\\）
                , `${JSON.stringify(scanAttr.openedDocIds).replace(new RegExp("[\\[\\]]", "g"), "")}`);
        console.log("SQL:", sqlStmt);
        let queryResult = await queryAPI(sqlStmt);
        return [queryResult, undefined];
    }
}

class TagMode extends ModeExample {
    static id = 4;
    id = 4;
    modeSettings = {};
    // 模式所需要的初始化工作，包括向模式设置区
    init() {
        let containerElem = document.getElementById("mode_config_container");
        containerElem.innerHTML = `<span>${language["mode4_input_tag_name"]}</span><input id="mode_tag_name"></input>`;
        console.log("INIT标签模式");
    }
    // 移除模式时所做的工作
    destory() {
        
    }
    // 载入模式内部设置
    load(modeSettings) {
        document.getElementById("mode_tag_name").value = modeSettings.mode_tag_name
    }
    // 保存模式内部设置，请返回一个对象，由挂件保存
    save() {
        return {
            mode_tag_name: document.getElementById("mode_tag_name").value
        }
    }
    // 执行，请返回要被创建为闪卡的块信息数组
    async scan(scanAttr) {
        let tagName = document.getElementById("mode_tag_name").value;
        let queryResult = await queryAPI(`select * from blocks where tag like "%#${tagName}#%" and ial not like "%custom-riff-decks%" and parent_id not in (select id from blocks where tag like "%#${tagName}#%")`);
        return [queryResult, undefined];
    }
}

/* BUG: 可能匹配到行内代码，示例：`==aaa==` */
class HighLightMode extends ModeExample {
    static id = 5;
    id = 5;
    modeSettings = {};
    // 模式所需要的初始化工作，包括向模式设置区
    init() {
        console.log("INIT高亮标记模式");
    }
    // 执行，请返回要被创建为闪卡的块信息数组
    async scan(scanAttr) {
        let queryResult = await queryAPI(`SELECT * FROM blocks WHERE root_id = '${scanAttr.currentDocId}' and type = "p" and markdown regexp '==.*=='`);
        return [queryResult, undefined];
    }
}

class ListItemQAFormatMode extends ModeExample {
    static id = 6;
    id = 6;
    modeSettings = {};
    // 模式所需要的初始化工作，包括向模式设置区
    init() {
        console.log("INIT列表QA模式");
    }
    // 执行，请返回要被创建为闪卡的块信息数组
    async scan(scanAttr) {
        let queryResult = await queryAPI(`SELECT * FROM blocks
        WHERE
            root_id  = "${scanAttr.currentDocId}"
        AND
            type = 'i'
        AND
            content regexp '${setting.in_mode_setting.mode6_qa_pattern}'`);
        return [queryResult, undefined];
    }
} 

const MODES = [HeadingMode, SuperBlockMode, SQLMode, TagMode/*, HighLightMode*/, ListItemQAFormatMode];
export { MODES };