/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const NS = 'org.accordproject.commonmark';

const CommonMarkParser = require('@accordproject/markdown-transform').CommonMarkParser;

/**
 * Converts a Slate document node to CommonMark AST
 * @param {*} document the Slate document node
 * @returns {*} the common mark AST
 */
function slateToCommonMarkAst(document) {

    const result = {
        $class : 'org.accordproject.commonmark.Document',
        xmlns : 'slate',
        nodes : []
    };
    _recursive(result, document.nodes);
    const parser = new CommonMarkParser();
    return parser.convertToConcertoObject(result);
}

/**
 * Converts an array of Slate nodes, pushing them into the parent
 * @param {*} parent the parent commonmark ast node
 * @param {*} nodes an array of Slate nodes
 */
function _recursive(parent, nodes) {

    nodes.forEach((node, index) => {

        let result = null;

        switch (node.object) {
        case 'text':
            result = handleText(node);
            break;
        default:
            switch(node.type) {
            case 'paragraph':
                result = {$class : `${NS}.Paragraph`, nodes: []};
                break;
            case 'quote':
                result = {$class : `${NS}.BlockQuote`};
                break;
            case 'horizontal_rule':
                result = {$class : `${NS}.ThematicBreak`};
                break;
            case 'heading_one':
                result = {$class : `${NS}.Heading`, level : '1', text: node.nodes[0].text};
                break;
            case 'heading_two':
                result = {$class : `${NS}.Heading`, level : '2', text: node.nodes[0].text};
                break;
            case 'heading_three':
                result = {$class : `${NS}.Heading`, level : '3', text: node.nodes[0].text};
                break;
            case 'heading_four':
                result = {$class : `${NS}.Heading`, level : '4', text: node.nodes[0].text};
                break;
            case 'heading_five':
                result = {$class : `${NS}.Heading`, level : '5', text: node.nodes[0].text};
                break;
            case 'heading_six':
                result = {$class : `${NS}.Heading`, level : '6', text: node.nodes[0].text};
                break;
            case 'block_quote':
                result = {$class : `${NS}.BlockQuote`, nodes: []};
                break;
            case 'code_block':
                result = {$class : `${NS}.CodeBlock`};
                break;
            case 'html_block':
                result = {$class : `${NS}.HtmlBlock`};
                break;
            case 'html_inline':
                result = {$class : `${NS}.HtmlInline`};
                break;
            case 'ol_list':
                result = {$class : `${NS}.List`, type: 'ordered', tight: 'true', nodes: []};
                break;
            case 'ul_list':
                result = {$class : `${NS}.List`, type: 'bullet', tight: 'true',
                    nodes: []};
                break;
            case 'list_item':
                result = {$class : `${NS}.Item`, nodes: []};
                result.nodes.push({$class : `${NS}.Paragraph`, nodes: []});
                break;
            case 'link': {
                const json = JSON.parse(JSON.stringify(node)); // not sure why we have to do this for inlines...
                result = {$class : `${NS}.Link`, destination: json.data.href, title: '', nodes: []};
                break;
            }
            }
        }

        if(!result) {
            throw Error(`Failed to process node ${JSON.stringify(node)}`);
        }

        // process any children, attaching to first child if it exists (for list items)
        if(node.nodes) {
            if(result.nodes) {
                _recursive(result.nodes[0] ? result.nodes[0] : result, node.nodes);
            }
            else {
                throw new Error(`Node ${JSON.stringify(result)} doesn't have children.`);
            }
        }

        if(!parent.nodes) {
            throw new Error(`Parent node doesn't have children ${JSON.stringify(parent)}`);
        }
        parent.nodes.push(result);
    });
}

/**
 * Handles a text node
 * @param {*} node the slate text node
 * @returns {*} the ast node
 */
function handleText(node) {

    let strong = null;
    let emph = null;
    let result = null;

    const isBold = node.marks.some(mark => mark.type === 'bold');
    const isItalic = node.marks.some(mark => mark.type === 'italic');
    const isCode = node.marks.some(mark => mark.type === 'code');

    if (isCode) {
        return {$class : `${NS}.Code`, text: node.text};
    }

    const text = {
        $class : `${NS}.Text`,
        text : node.text
    };

    if (isBold) {
        strong = {$class : `${NS}.Strong`, nodes: []};
    }

    if (isItalic) {
        emph  = {$class : `${NS}.Emph`, nodes: []};
    }

    if(strong && emph) {
        result = emph;
        emph.nodes.push(strong);
        strong.nodes.push(text);
    }
    else {
        if(strong) {
            result = strong;
            strong.nodes.push(text);
        }

        if(emph) {
            result = emph;
            emph.nodes.push(text);
        }
    }

    if(!result) {
        result = text;
    }

    return result;
}

module.exports = slateToCommonMarkAst;