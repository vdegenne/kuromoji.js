/*
 * Copyright 2014 Takuya Asano
 * Copyright 2010-2014 Atilika Inc. and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS
 * OF ANY KIND, either express or implied.
 * See the License for the specific language governing
 * permissions and limitations under the License.
 */

'use strict'

var Tokenizer = require('./Tokenizer')
var DictionaryLoader = require('./loader/NodeDictionaryLoader')

function TokenizerBuilder(option) {
	option = option || {}

	this.dic_path = option.dicPath == null ? 'dict/' : option.dicPath

	this.dict_file_format = option.dictFileFormat || 'dat'
	this.on_progress = option.onProgress || null
}

TokenizerBuilder.prototype.build = function (callback) {
	var loader = new DictionaryLoader(this.dic_path, {
		dictFileFormat: this.dict_file_format,
		onProgress: this.on_progress,
	})

	loader.load(function (err, dic) {
		if (err) {
			callback(err, null)
			return
		}

		callback(null, new Tokenizer(dic))
	})
}

module.exports = TokenizerBuilder
