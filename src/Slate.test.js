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

// @ts-nocheck
/* eslint-disable no-undef */
'use strict';

const fs = require('fs');
const path = require('path');
const Value = require('slate').Value;
const CommonMarkParser = require('@accordproject/markdown-transform').CommonMarkParser;
const commonMarkToString = require('@accordproject/markdown-transform').commonMarkToString;
const slateToCommonMarkAst = require('./slateToCommonMarkAst');
let parser = null;

// @ts-ignore
beforeAll(() => {
    parser = new CommonMarkParser();
    // const result = parser.parse('this is `some code`.');
    // const json = parser.getSerializer().toJSON(result);
    // console.log(JSON.stringify(json, null, 4));
    // console.log(commonMarkToString(result));
});

/**
 * Get the name and contents of all slate test files
 * @returns {*} an array of name/contents tuples
 */
function getSlateFiles() {
    const result = [];
    const files = fs.readdirSync(__dirname + '/../test/');

    files.forEach(function(file) {
        if(file.endsWith('.json')) {
            let contents = fs.readFileSync(__dirname + '/../test/' + file, 'utf8');
            result.push([file, contents]);
        }
    });

    return result;
}

describe('slate', () => {
    getSlateFiles().forEach( ([file, jsonText]) => {
        it(`converts ${file} to concerto`, () => {
            const value = Value.fromJSON(JSON.parse(jsonText));
            const concertoObject = slateToCommonMarkAst(value.document);
            const json = parser.getSerializer().toJSON(concertoObject);
            // console.log(JSON.stringify(json, null, 4));
            expect(json).toMatchSnapshot();

            // load expected markdown
            const extension = path.extname(file);
            const mdFile = path.basename(file,extension);
            const expectedMarkdown = fs.readFileSync(__dirname + '/../test/' + mdFile + '.md', 'utf8');
            const md = commonMarkToString(concertoObject);
            expect(md).toEqual(expectedMarkdown);
        });
    });
});