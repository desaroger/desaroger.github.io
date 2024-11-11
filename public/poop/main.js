
/**
 * 
 * @param {File} file 
 */
async function onFileUploaded(file) {
    const messages = await fileToString(file);
    const poopMessages = messages.filter(m => m.message === '💩' && !!m.author);
    const poopMessagesGrouped = groupMessagesByAuthor(poopMessages);
    poopMessagesGrouped.sort((a, b) => {
        return b.messages.length - a.messages.length;
    });
    // console.log({poopMessages, poopMessagesGrouped});

    // Prepare date picker
    const picker = new Litepicker({ 
        element: document.getElementById('date') 
    });
    const startDate = poopMessages[0].date;
    const endDate = poopMessages[poopMessages.length - 1].date;
    picker.setDateRange(startDate, endDate);

    const results = {
        totalPoops: poopMessages.length,
        winner: poopMessagesGrouped
            .filter(g => {
                return g.messages.length === poopMessagesGrouped[0].messages.length;
            })
            .map(g => g.author)
            .join(', ') + ` (${poopMessagesGrouped[0].messages.length})`,
        loser: poopMessagesGrouped
            .filter(g => {
                return g.messages.length === poopMessagesGrouped[poopMessagesGrouped.length - 1].messages.length;
            })
            .map(g => g.author)
            .join(', ') + ` (${poopMessagesGrouped[poopMessagesGrouped.length - 1].messages.length})`,

        // details:
        Ranking: '',
        ...(poopMessagesGrouped.reduce((r, g) => {
            return {
                ...r,
                [` - ${g.author}`]: g.messages.length,
            }
        }, {})),
    }

    document.getElementById('pre').innerHTML = Object.keys(results).map(k => `${k}: ${results[k]}`).join('\n');

    const days = [0, 1, 2, 3, 4, 5, 6];
    const hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].reverse();
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const converser = [6,0,1,2,3,4,5];

    Plotly.newPlot("gd", /* JSON object */ {
        "data": [
            {
                z: hours.map(h => {
                    return days.map(d => {
                        const count = poopMessages
                            .filter(m => {
                                return converser[m.date.getDay()] === d && m.date.getHours() === h;
                            })
                            .length;
                        
                        return count;
                    });
                }),
                x: dayNames,
                y: hours,
                type: 'heatmap',
                hoverongaps: false
            }
          ],
        "layout": { "width": 600, "height": 400}
    })

}

/**
 * 
 * @param {{date: Date, author: string, message: string}[]} messages 
 * 
 * @returns {{author: string, messages: {date: Date, author: string, message: string}[]}[]}
 */
function groupMessagesByAuthor(messages) {
    return messages.reduce((r, message) => {
        let item = r.find(rr => rr.author === message.author);
        if (!item) {
            item = {author: message.author, messages: []};
            r.push(item);
        }

        item.messages.push(message);
        // r[message.author] ??= {messages: []};
        // r[message.author].messages.push(message);
        return r;
    }, []);
}


/**
 * 
 * @param {File} file 
 * 
 * @returns {Promise<{date: Date, author: string | null, message: string}[]>}
 */
async function fileToString(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.addEventListener('loadend', e => {
            const messagesText = e.target.result;
            const messages = whatsappChatParser.parseString(messagesText);
            resolve(messages);
        });

        if (/^application\/(?:x-)?zip(?:-compressed)?$/.test(file.type)) {
            reader.readAsArrayBuffer(file);
        } else if (file.type === 'text/plain') {
            reader.readAsText(file);
        } else {
            alert(`File type '${file.type}' not supported`);
        }
    });
}
