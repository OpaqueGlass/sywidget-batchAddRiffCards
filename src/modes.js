import { getCurrentDocIdF, queryAPI } from "./API.js";
import { language } from "./config.js";

class ModeExample {
    static id = -1;
    id = -1;
    // 模式所需要的初始化工作，包括向模式设置区
    async init() {
        console.log("INIT")
    }
    // 移除模式时所做的工作
    async destory() {
        
    }
    // 载入模式内部设置
    load(modeSettings) {

    }
    // 保存模式内部设置，请返回一个对象，由挂件保存
    save() {
        return undefined;
    }
    // 执行，请返回要被创建为闪卡的块id数组
    async scan() {

    }
}

class HeadingMode {
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
        </select>`;
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
        let queryResult = await queryAPI(`select * from blocks where path like '%${scanAttr.currentDocId}.sy' and type = 'h' and subtype = '${document.getElementById("mode_heading").value}';`);
        // let result = queryResult.map((curValue, index) => {
        //     return curValue.id;
        // });
        return [queryResult, scanAttr.userSelectDeckId];
    }
}

class SuperBlockMode {
    static id = 2;
    id = 2;
    // 模式所需要的初始化工作，包括向模式设置区
    init() {
        console.log("INIT超级块模式");
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
    // 执行，请返回要被创建为闪卡的块信息数组
    async scan(scanAttr) {
        let queryResult = await queryAPI(`select * from blocks where path like '%${scanAttr.currentDocId}.sy' and type = 's';`);
        return [queryResult, scanAttr.userSelectDeckId];
    }
}

class SQLMode {
    static id = 3;
    id = 3;
    // 模式所需要的初始化工作，包括向模式设置区
    init() {
        console.log("INITSQL模式");
        let containerElem = document.getElementById("mode_config_container");
        containerElem.innerHTML = `<textarea id="mode_user_sql" rows="7" cols="66" placeholder="在此输入SQL / Input SQL here"></textarea>`;
        document.getElementById("mode_user_sql").addEventListener("keydown", this.tabHandler);
    }
    // 移除模式时所做的工作
    destory() {
        document.getElementById("mode_user_sql").removeEventListener("keydown", this.tabHandler);
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
        console.log("SQL:", sqlStmt);
        let queryResult = await queryAPI(sqlStmt);
        return [queryResult, scanAttr.userSelectDeckId];
    }
    tabHandler(e) {
        if (e.keyCode == 9 && e.shiftKey == false) {
            e.preventDefault();
            let indent = "    ";
            let start = this.selectionStart;
            let end = this.selectionEnd;
            // 未选择，直接插入空格
            if (start == end) {
                document.execCommand("insertText", false, indent);
                window.getSelection().collapseToEnd();
                return;
            }
            // 选择行内内容时，置换选择内容为缩进
            if (!window.getSelection().toString().includes("\n")) {
                document.execCommand("insertText", false, indent);
                return;
            }
            // 已选择，调整选区开头为所选中的行（未选中行首，则扩选到行首）
            let strBeforeStart = this.value.substring(0, start);
            start = strBeforeStart.includes('\n')? strBeforeStart.lastIndexOf('\n') + 1 : 0;
            this.setSelectionRange(start, end);
            let selected = window.getSelection().toString();
            // 为选区内的换行前加入缩进
            selected = indent + selected.replace(new RegExp("\n", "g"), '\n' + indent);
            // 替换选区
            document.execCommand("insertText", false, selected);
            // this.value = this.value.substring(0, start) + selected + this.value.substring(end);
            // 重设选区
            this.setSelectionRange(start, start + selected.length);
            
        }else if (e.keyCode == 9) {
            e.preventDefault();
            let indent = "    ";
            let start = this.selectionStart;
            let end = this.selectionEnd;
            let noSelectFlag = false;
            if (start == end) noSelectFlag = true;
            let strBeforeStart = this.value.substring(0, start);
            // 调整选区为所选中的行（未选中行首，则扩选到行首）
            let rowStart = strBeforeStart.includes('\n')? strBeforeStart.lastIndexOf('\n')+1 : 0;
            // 在未选中状态下，为防止替换失败，需要再多扩选至少1个字符
            if (noSelectFlag) {
                if (rowStart >= 2) rowStart -= 2;
            }
            // 选择扩选后的内容
            this.setSelectionRange(rowStart, end);
            // 替换扩选选区内的缩进
            let selected = window.getSelection().toString();
            let oldLength = selected.length;
            selected = selected.replace(new RegExp(`\n${indent}`, "g"), "\n");
            selected = selected.replace(new RegExp(`^${indent}`, "g"), "");

            document.execCommand("insertText", false, selected);
            // this.value = this.value.substring(0, rowStart) + selected + this.value.substring(end);
            // 重设选区
            if (noSelectFlag) {
                if (start - (oldLength - selected.length) >= this.value.length) {
                    this.setSelectionRange(this.value.length, this.value.length);
                }else{
                    this.setSelectionRange(start - (oldLength - selected.length), start - (oldLength - selected.length));
                }
            }else{
                this.setSelectionRange(rowStart, rowStart + selected.length);
            }
        }
    }
}

class TagMode {
    static id = 4;
    id = 4;
    modeSettings = {};
    // 模式所需要的初始化工作，包括向模式设置区
    init() {
        let containerElem = document.getElementById("mode_config_container");
        containerElem.innerHTML = `<span>${language["mode4_input_tag_name"]}</span><input id="mode_tag_name">
        </input>`;
        console.log("INIT标题模式");
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
        let queryResult = await queryAPI(`select * from blocks where tag like "%#${tagName}#%" and parent_id not in (select id from blocks where tag like "%#${tagName}#%")`);
        return [queryResult, scanAttr.userSelectDeckId];
    }
}

const MODES = [HeadingMode, SuperBlockMode, SQLMode, TagMode];
export { MODES };