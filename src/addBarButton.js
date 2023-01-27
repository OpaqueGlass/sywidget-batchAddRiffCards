/**
 * addBarButton.js 向顶栏中添加按钮以显示挂件。
 */
// REF: https://ld246.com/article/1662969146166S
let barVipElem = document.getElementById("toolbarVIP");
barVipElem.insertAdjacentHTML("afterend", `
<button id="barBatchAddRiffCard" class="toolbar__item b3-tooltips b3-tooltips__se" aria-label="唤起制卡页面"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 14.5V16.5H13V14.5H15V12.5H13V10.5H11V12.5H9V14.5H11Z" fill="currentColor" /><path fill-rule="evenodd" clip-rule="evenodd" d="M4 1.5C2.89543 1.5 2 2.39543 2 3.5V4.5C2 4.55666 2.00236 4.61278 2.00698 4.66825C0.838141 5.07811 0 6.19118 0 7.5V19.5C0 21.1569 1.34315 22.5 3 22.5H21C22.6569 22.5 24 21.1569 24 19.5V7.5C24 5.84315 22.6569 4.5 21 4.5H11.874C11.4299 2.77477 9.86384 1.5 8 1.5H4ZM9.73244 4.5C9.38663 3.9022 8.74028 3.5 8 3.5H4V4.5H9.73244ZM3 6.5C2.44772 6.5 2 6.94772 2 7.5V19.5C2 20.0523 2.44772 20.5 3 20.5H21C21.5523 20.5 22 20.0523 22 19.5V7.5C22 6.94772 21.5523 6.5 21 6.5H3Z" fill="currentColor" /></svg></button>
`);
let barButton = document.getElementById("barBatchAddRiffCard");

document.body.insertAdjacentHTML(
    "beforeend",
    ` 
        <div
            data-node-index="1"
            data-type="NodeWidget"
            class="iframe"
            data-subtype="widget"
            id="batchAddRiffCardsPanelOuterDiv"
        >
            <div class="iframe-content">
                <iframe 
                    id="batchAddRiffCardsPanel" 
                    style="
                        display: none;
                        position: fixed; 
                        z-index: 1000; 
                        top: 230px; 
                        width: 600px; 
                        height: 300px; 
                        background-color: var(--b3-theme-background);
                        box-shadow: var(--b3-dialog-shadow); 
                        border:none; 
                        border-radius: 5px; 
                        transform: translate(-50%, -50%); 
                        overflow: auto;" 
                    src="/widgets/batchAddRiffCards-dev" 
                    data-src="/widgets/batchAddRiffCards-dev" 
                    data-subtype="widget" 
                >
                </iframe>
            </div>
        </div>
        `
);

let batchAddPanel = document.getElementById("batchAddRiffCardsPanel");

// batchAddPanel.style.width = window.screen.availWidth - barButton.offset + "px";
barButton.addEventListener(
    "click",
    function (e) {
        e.stopPropagation();
        if (batchAddPanel.style.display === "none") {
            adjustPanelPosition(barButton, batchAddPanel);
            batchAddPanel.style.display = "block";
            window.addEventListener("click", hideBatchAddPanel, false);
        } else {
            batchAddPanel.style.display = "none";
            window.removeEventListener("click", hideBatchAddPanel, false);
        }
    },
    false
);

function hideBatchAddPanel(e) {
    batchAddPanel.style.display = "none";
    window.removeEventListener("click", hideBatchAddPanel, false);
    e.stopPropagation();
}

/**
 * 面板位置调整，尽力调整到面板居中显示在按钮下方
 * @author OpaqueGlass
 * @param {*} btnElem 
 * @param {*} panelElem 
 */
function adjustPanelPosition(btnElem, panelElem) {
    // 计算右侧是否有足够空间居中显示，值>0表示不足，需要另外占据左侧空间以便全部显示
    let rightNeedSpare = panelElem.clientWidth / 2 - (window.innerWidth - btnElem.offsetLeft - btnElem.clientWidth / 2);
    let pannelRightSpace = 0;
    // 当调整后右侧贴边时，到右侧留下补充距离
    if (rightNeedSpare >= 0) {
        pannelRightSpace = 20;
    } else {
        // 右侧不需要其他空间，置0
        rightNeedSpare = 0;
    }
    // 计算左侧距离
    let calculateLeft = btnElem.offsetLeft + btnElem.clientWidth / 2 - rightNeedSpare - pannelRightSpace;
    // 总距离不足
    if (calculateLeft < 0) {
        calculateLeft = 0;
        if (window.innerWidth < panelElem.clientWidth / 2) {
            panelElem.style.width = window.innerWidth + "px";
        }
    }
    panelElem.style.left = calculateLeft + "px";
    let calculateTop = btnElem.offsetTop + btnElem.clientHeight
        + parseInt(panelElem.style.height.substring(0, panelElem.style.height.length)) / 2;
    panelElem.style.top = calculateTop + "px";
}