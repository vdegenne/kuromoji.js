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
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied.
 * See the License for the specific language governing
 * permissions and limitations under the License.
 */

'use strict'

var path = require('path')
var async = require('async')
var DynamicDictionaries = require('../dict/DynamicDictionaries')

var DICTIONARY_FILES = [
	'base',
	'check',
	'tid',
	'tid_pos',
	'tid_map',
	'cc',
	'unk',
	'unk_pos',
	'unk_map',
	'unk_char',
	'unk_compat',
	'unk_invoke',
]

/**
 * DictionaryLoader base constructor
 * @param {string} dic_path Dictionary path
 * @param {Object} options Loader options
 * @constructor
 */
function DictionaryLoader(dic_path, options) {
	options = options || {}

	this.dic = new DynamicDictionaries()
	this.dic_path = dic_path
	this.dict_file_format = options.dictFileFormat || 'dat'
	this.onProgress = options.onProgress || null

	if (this.dict_file_format !== 'dat' && this.dict_file_format !== 'gz') {
		throw new Error(
			'Unsupported dictionary file format: ' + this.dict_file_format,
		)
	}
}

DictionaryLoader.prototype.loadArrayBuffer = function (
	file,
	onProgress,
	callback,
) {
	throw new Error('DictionaryLoader#loadArrayBuffer should be overwritten')
}

/**
 * Load dictionary files
 * @param {DictionaryLoader~onLoad} load_callback Callback function
 */
DictionaryLoader.prototype.load = function (load_callback) {
	var dic = this.dic
	var dic_path = this.dic_path
	var loadArrayBuffer = this.loadArrayBuffer
	var extension = this.dict_file_format === 'gz' ? '.dat.gz' : '.dat'
	var progress = {}
	var self = this

	DICTIONARY_FILES.forEach(function (name) {
		progress[name] = {
			loaded: 0,
			total: 0,
			lengthComputable: false,
			complete: false,
		}
	})

	function reportProgress() {
		if (typeof self.onProgress !== 'function') {
			return
		}

		var loaded = 0
		var total = 0
		var filesLoaded = 0
		var lengthComputable = true

		DICTIONARY_FILES.forEach(function (name) {
			var file = progress[name]

			loaded += file.loaded

			if (file.complete) {
				filesLoaded++
			}

			if (file.lengthComputable) {
				total += file.total
			} else {
				lengthComputable = false
			}
		})

		self.onProgress({
			loaded: loaded,
			total: total,
			lengthComputable: lengthComputable,
			filesLoaded: filesLoaded,
			filesTotal: DICTIONARY_FILES.length,
		})
	}

	function loadFile(name, callback) {
		var filename = name + extension
		var fileProgress = progress[name]

		loadArrayBuffer.call(
			self,
			path.join(dic_path, filename),
			function (event) {
				fileProgress.loaded = event.loaded || 0
				fileProgress.total = event.total || 0
				fileProgress.lengthComputable = event.lengthComputable === true

				reportProgress()
			},
			function (err, buffer) {
				if (!err) {
					fileProgress.complete = true

					if (!fileProgress.lengthComputable) {
						fileProgress.loaded = 0
					} else {
						fileProgress.loaded = fileProgress.total
					}
				}

				reportProgress()
				callback(err, buffer)
			},
		)
	}

	async.parallel(
		[
			// Trie
			function (callback) {
				async.map(['base', 'check'], loadFile, function (err, buffers) {
					if (err) {
						return callback(err)
					}

					var base_buffer = new Int32Array(buffers[0])
					var check_buffer = new Int32Array(buffers[1])

					dic.loadTrie(base_buffer, check_buffer)
					callback(null)
				})
			},

			// Token info dictionaries
			function (callback) {
				async.map(
					['tid', 'tid_pos', 'tid_map'],
					loadFile,
					function (err, buffers) {
						if (err) {
							return callback(err)
						}

						var token_info_buffer = new Uint8Array(buffers[0])
						var pos_buffer = new Uint8Array(buffers[1])
						var target_map_buffer = new Uint8Array(buffers[2])

						dic.loadTokenInfoDictionaries(
							token_info_buffer,
							pos_buffer,
							target_map_buffer,
						)

						callback(null)
					},
				)
			},

			// Connection cost matrix
			function (callback) {
				loadFile('cc', function (err, buffer) {
					if (err) {
						return callback(err)
					}

					var cc_buffer = new Int16Array(buffer)
					dic.loadConnectionCosts(cc_buffer)
					callback(null)
				})
			},

			// Unknown dictionaries
			function (callback) {
				async.map(
					['unk', 'unk_pos', 'unk_map', 'unk_char', 'unk_compat', 'unk_invoke'],
					loadFile,
					function (err, buffers) {
						if (err) {
							return callback(err)
						}

						var unk_buffer = new Uint8Array(buffers[0])
						var unk_pos_buffer = new Uint8Array(buffers[1])
						var unk_map_buffer = new Uint8Array(buffers[2])
						var cat_map_buffer = new Uint8Array(buffers[3])
						var compat_cat_map_buffer = new Uint32Array(buffers[4])
						var invoke_def_buffer = new Uint8Array(buffers[5])

						dic.loadUnknownDictionaries(
							unk_buffer,
							unk_pos_buffer,
							unk_map_buffer,
							cat_map_buffer,
							compat_cat_map_buffer,
							invoke_def_buffer,
						)

						callback(null)
					},
				)
			},
		],
		function (err) {
			load_callback(err, dic)
		},
	)
}

module.exports = DictionaryLoader
