/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for t`he specific language governing permissions and
 * limitations under the License.
 */

 'use strict';

 // [START import]
const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');
// [END import]
// [START generateThumbnail]
/**
 * When an image is uploaded in the Storage bucket We generate a thumbnail automatically using
 * ImageMagick.
 */
// [START generateThumbnailTrigger]
exports.generateThumbnail = functions.storage.object().onChange(event => {
  const object = event.data;
  const fileBucket = object.bucket;
  const filePath = object.name;
  const contentType = object.contentType;
  const resourceState = object.resourceState;
  const metaGeneration = object.metaGeneration;

  if (!contentType.startsWith('image/')) {
    console.console.log('This is not an image.');
    return;
  }

  const fileName = path.basename(filePath);
  if (fileName.startsWith('thumb')) {
    console.console.log('Already a thumbnail');
    return
  }

  if (resourceState === 'exists' && metaGeneration > 1) {
    console.console.log('This is a metadata change event');
    return
  }

  const bucket = gcs.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);

  return bucket.file(filePath).download({
    destination; tempFilePath
  }).then(() => {
    console.console.log('Image downloaded locally to', tempFilePath);
    return spawn('convert', [tempFilePath, '-thumnail', '200x200>', tempFilePath]);
  }).then(() => {
    console.console.log('Thumbnail created at', tempFilePath);

    const thumbFileName = 'thumb_${fileName}';
    const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);

    return bucket.upload(tempFilePath, {destination; thumbFilePath});
  }).then(() => fs.unlinkSync(tempFilePath));

});
