const fs = require('fs');
const path = require('path');

function fixFile(filePath, isMeetings) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // 1. Convert arrow functions to variable assignments with parenthesis
    if (isMeetings) {
        content = content.replace(/const RecordPanel = \(\) => \(/g, 'const recordPanelContent = (');
    } else {
        content = content.replace(/const UploadPanel = \(\) => \(/g, 'const uploadPanelContent = (');
    }
    content = content.replace(/const HistoryList = \(\) => \(/g, 'const historyListContent = (');
    content = content.replace(/const SummaryPanel = \(\) => \(/g, 'const summaryPanelContent = (');

    // 2. Fix the specific JS ternary edge-case inside SummaryPanel where HistoryList is rendered
    // Before:
    //     ) : (
    //       <HistoryList />
    //     )
    // After:
    //     ) : (
    //       historyListContent
    //     )
    content = content.replace(/\)\s*:\s*\(\s*<HistoryList \/>\s*\)/g, ') : (\n      historyListContent\n    )');

    // 3. Replace all JSX usages
    if (isMeetings) {
        content = content.replace(/<RecordPanel \/>/g, '{recordPanelContent}');
    } else {
        content = content.replace(/<UploadPanel \/>/g, '{uploadPanelContent}');
    }
    content = content.replace(/<HistoryList \/>/g, '{historyListContent}');
    content = content.replace(/<SummaryPanel \/>/g, '{summaryPanelContent}');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Successfully fixed ${path.basename(filePath)}`);
}

const dir = path.join(__dirname, 'src', 'pages');
fixFile(path.join(dir, 'Documents.jsx'), false);
fixFile(path.join(dir, 'Meetings.jsx'), true);
