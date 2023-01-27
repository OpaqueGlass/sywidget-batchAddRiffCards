/**
 * uncommon.js 可能仅适用于当前项目的工具函数
 * !当心循环import
 */

/**
 * textarea 处理 Tab和Shift+Tab
 * @author OpaqueGlass
 * 部分参考了: https://www.jianshu.com/p/2732f6a2f398 https://www.cnblogs.com/weiyinfu/p/5594769.html
 *  */ 
export function tabHandler(e) {
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
        // 选择行内内容且并未选择整行时，置换选择内容为缩进
        if (!window.getSelection().toString().includes("\n") 
            && !((start == 0 || this.value[start - 1] == "\n") && (end == this.value.length || this.value[end] == "\n"))) {
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
        let originSelected = selected;
        selected = selected.replace(new RegExp(`\n${indent}`, "g"), "\n");
        selected = selected.replace(new RegExp(`^${indent}`, "g"), "");
        if (selected === originSelected) {
            this.setSelectionRange(start, start);
            return;
        }
        document.execCommand("insertText", false, selected);
        // this.value = this.value.substring(0, rowStart) + selected + this.value.substring(end);
        // 重设选区
        if (noSelectFlag) {
            // if (start - (oldLength - selected.length) >= this.value.length) {
            //     this.setSelectionRange(this.value.length, this.value.length);
            // }else{
                this.setSelectionRange(start - (oldLength - selected.length), start - (oldLength - selected.length));
            // }
        }else{
            this.setSelectionRange(rowStart, rowStart + selected.length);
        }
    }
}