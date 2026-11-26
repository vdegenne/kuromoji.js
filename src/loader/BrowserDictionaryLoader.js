/*
 * Copyright 2014 Takuya Asano
 * Copyright 2010-2014 Atilika Inc. and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance
 * with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied.
 * See the License for the specific language governing
 * permissions and limitations under the License.
 */

'use strict'

var DictionaryLoader = require('./DictionaryLoader')

/**
 * BrowserDictionaryLoader inherits DictionaryLoader, using XMLHttpRequest
 * @param {string} dic_path Dictionary path
 * @param {Object} options Loader options
 * @constructor
 */
function BrowserDictionaryLoader(dic_path, options) {
	DictionaryLoader.apply(this, [dic_path, options])
}

BrowserDictionaryLoader.prototype = Object.create(DictionaryLoader.prototype)
BrowserDictionaryLoader.prototype.constructor = BrowserDictionaryLoader

/**
 * Utility function to load dictionary
 * @param {string} url Dictionary URL
 * @param {Function} onProgress Download progress callback
 * @param {BrowserDictionaryLoader~onLoad} callback Callback function
 */
BrowserDictionaryLoader.prototype.loadArrayBuffer = function (
	url,
	onProgress,
	callback,
) {
	var xhr = new XMLHttpRequest()
	var dictFileFormat = this.dict_file_format

	xhr.open('GET', url, true)
	xhr.responseType = 'arraybuffer'

	xhr.onprogress = function (event) {
		if (typeof onProgress === 'function') {
			onProgress(event)
		}
	}

	xhr.onload = function () {
		if (xhr.status > 0 && xhr.status !== 200) {
			callback(new Error(xhr.statusText || 'HTTP ' + xhr.status), null)
			return
		}

		if (dictFileFormat === 'dat') {
			callback(null, xhr.response)
			return
		}

		var buffer = xhr.response
		var bytes = new Uint8Array(buffer)

		// Gzip magic number: 0x1f 0x8b
		var isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b

		if (!isGzip) {
			callback(null, buffer)
			return
		}

		if (typeof DecompressionStream === 'undefined') {
			callback(
				new Error('DecompressionStream is not supported by this browser'),
				null,
			)
			return
		}

		try {
			var compressed = new Blob([buffer])
			var decompressed = compressed
				.stream()
				.pipeThrough(new DecompressionStream('gzip'))

			new Response(decompressed).arrayBuffer().then(
				function (buffer) {
					callback(null, buffer)
				},
				function (err) {
					callback(err, null)
				},
			)
		} catch (err) {
			callback(err, null)
		}
	}

	xhr.onerror = function () {
		callback(new Error('Dictionary download failed: ' + url), null)
	}

	xhr.send()
}

/**
 * Callback
 * @callback BrowserDictionaryLoader~onLoad
 * @param {Object} err Error object
 * @param {ArrayBuffer} buffer Loaded buffer
 */

module.exports = BrowserDictionaryLoader
