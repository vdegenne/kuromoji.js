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

var fs = require('fs')
var node_zlib = require('zlib')
var DictionaryLoader = require('./DictionaryLoader')

function NodeDictionaryLoader(dic_path, options) {
	DictionaryLoader.apply(this, [dic_path, options])
}

NodeDictionaryLoader.prototype = Object.create(DictionaryLoader.prototype)
NodeDictionaryLoader.prototype.constructor = NodeDictionaryLoader

NodeDictionaryLoader.prototype.loadArrayBuffer = function (
	file,
	onProgress,
	callback,
) {
	var dictFileFormat = this.dict_file_format

	fs.readFile(file, function (err, buffer) {
		if (err) {
			return callback(err, null)
		}

		function returnArrayBuffer(data) {
			var arrayBuffer = data.buffer.slice(
				data.byteOffset,
				data.byteOffset + data.byteLength,
			)

			callback(null, arrayBuffer)
		}

		if (dictFileFormat === 'dat') {
			returnArrayBuffer(buffer)
			return
		}

		node_zlib.gunzip(buffer, function (err, decompressed) {
			if (err) {
				return callback(err, null)
			}

			returnArrayBuffer(decompressed)
		})
	})
}

module.exports = NodeDictionaryLoader
