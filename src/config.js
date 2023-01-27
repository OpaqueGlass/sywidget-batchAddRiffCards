/**
 * config.js
 * 挂件默认设置和全局配置。
 * 
 * 【如果修改后崩溃或运行不正常，请删除挂件重新下载，或更改前手动备份】
 * 请不要删除//双斜杠注释
 * 请不要删除//双斜杠注释前的英文逗号,（如果有）
 * 为true 或者 false的设置项，只能填这两者
 * 有英文双引号的设置项，只更改英文双引号内的内容，不要删除英文双引号
 *  */

let widgetDistinctSetting = {
    target_deck_id: "", // 添加到目标卡组
    current_mode: "1", // 批量查询插入块模式

};
// 全局设置
let setting = {
    
};
//全局设置
let token = "";//API鉴权token，可以不填的样子（在设置-关于中查看）
let zh_CN = {
    // 界面 UI
    ui_select_mode: "添加模式：",
    ui_select_deck: "目标卡包：",
    ui_table_id: "id",
    ui_table_content_preview: "内容预览",
    ui_table_operation: "操作",
    ui_table_op_delete: "移除",
    ui_btn_preview: "检索并生成预览",
    ui_btn_add: "执行批量添加",
    ui_btn_save_setting: "保存设置",
    // 模式名称 mode names
    mode1: "标题（当前文档）",
    mode2: "超级块（当前文档）",
    mode3: "SQL",
    mode4: "标签（实验性）",
    // 提示词 hint word
    hint_block_not_found: "【添加失败】未找到符合条件的块",
    hint_deck_not_selected: "【添加失败】未选择目标卡包",
    hint_check_preview_first: "【添加失败】请先点击“检查按钮”生成预览",
    hint_deck_not_exist: "【添加失败】指定的卡包不存在",
    info_batch_add_done: "【添加成功】请求添加闪卡@@张，实际添加闪卡@@张。",
    info_preview_done: "预览加载完成，检索到@@个匹配块",
    info_remove_block: "移除块@@，剩余@@个块。",
    info_loading_decks_info: "载入卡包信息中",
    info_loaded_decks_info: "成功载入卡包信息",
    error_getAttrFailed: "读取挂件设置失败",
    error_gen_preview_failed: "生成预览时发生错误",
    // 模式内部提示词 words in modes
    mode1_select_heading: "选择标题：",
    mode1_include_child_docs: "包括子文档",
    mode4_input_tag_name: "标签全称：",
    // 模式简要介绍词 introductions for modes
    mode1_introduction: "为当前文档的所有指定标题制卡",
    mode2_introduction: "为当前文档的所有超级块制卡",
    mode3_introduction: `通过SQL对符合条件的块制卡<br/>
            支持部分关键词：
            <ul>
                <li><code>@CUR_DOC@</code> 将被替换为当前文档id，例 <code>20230119224224-zxlrw2q</code></li>
                <li><code>@ALL_OPEN_DOC@</code> 将被替换为所有已打开文档id\*，例 <code>"20230119224224-zxlrw2q", "20230125123155-0v7lfcs"</code></li>
            </ul>`,
    mode4_introduction: "🧪❕实验性功能，功能最终表现可能不符合预期。<br/>为所有含指定标签的块制卡（存在嵌套关系的块，只对最外层块制卡）。标签名应当为全称，例 <code>RiffCards/Java</code>。",

};
let en_US = {//先当他不存在 We don't fully support English yet.
    
};
let language = zh_CN; // 使用的语言 the language in use. Only zh_CN is available.
// ~~若思源设定非中文，则显示英文~~
// let siyuanLanguage;
// try{
//     siyuanLanguage = window.top.siyuan.config.lang;
// }catch (err){
//     console.warn("读取语言信息失败");
// }
// if (siyuanLanguage != zh_CN && siyuanLanguage != undefined) {
//     language = en_US;
// }


// 导入外部config.js 测试功能，如果您不清楚，请避免修改此部分；
try {
    let allCustomConfig = await import('/widgets/custom.js');
    let customConfig = null;
    let customConfigName = "batchAddRiffCards";
    if (allCustomConfig[customConfigName] != undefined) {
        customConfig = allCustomConfig[customConfigName];
    }else if (allCustomConfig.config != undefined && allCustomConfig.config[customConfigName] != undefined) {
        customConfig = allCustomConfig.config[customConfigName];
    }
    // 导入token
    if (allCustomConfig.token != undefined) {
        token = allCustomConfig.token;
    }else if (allCustomConfig.config != undefined && allCustomConfig.config.token != undefined) {
        token = allCustomConfig.config.token;
    }
    
    // 仅限于config.setting/config.defaultAttr下一级属性存在则替换，深层对象属性将完全覆盖
    if (customConfig != null) {
        if ("setting" in customConfig) {
            for (let key in customConfig.setting) {
                if (key in setting) {
                    setting[key] = customConfig.setting[key];
                }
            }
        }
        // dev： 引入每一个，每一行都要改
        if ("widgetDistinctSetting" in customConfig) { //改1处
            for (let key in customConfig.widgetDistinctSetting) {//改1处
                if (key in widgetDistinctSetting) {//改1处
                    widgetDistinctSetting[key] = customConfig.widgetDistinctSetting[key];//改2处
                }
            }
        }
        
    }
    
}catch (err) {
    console.warn("导入用户自定义设置时出现错误", err);
}


export {widgetDistinctSetting, token, language, setting};