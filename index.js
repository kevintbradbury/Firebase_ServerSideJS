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
 const mkdirp = require('mkdirp-promise');
 // Include a Service Account Key to use a Signed URL
 const gcs = require('@google-cloud/storage')({keyFilename: 'service-account-credentials.json'});
 const admin = require('firebase-admin');
 admin.initializeApp(functions.config().firebase);
 const spawn = require('child-process-promise').spawn;
 const path = require('path');
 const os = require('os');
 const fs = require('fs');

// Configure the email transport using the default SMTP transport and a GMail account.
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.

const gmailEmail = encodeURIComponent(functions.config().gmail.email);
const gmailPassword = encodeURIComponent(functions.config().gmail.password);
const nodemailer = require('nodemailer');
const mailTransport = nodemailer.createTransport(
    `smtps://${gmailEmail}:${gmailPassword}@smtp.gmail.com`);

// [END import]
// [START generateThumbnail]
/**
 * When an image is uploaded in the Storage bucket We generate a thumbnail automatically using
 * ImageMagick.
 */
// [START generateThumbnailTrigger]
exports.generateThumbnail = functions.storage.object().onChange(event => {
  const snapshot = event.data;
  const filePath = event.data.name;
 const fileDir = path.dirname(filePath);
 const fileName = path.basename(filePath);
 const tempLocalFile = path.join(os.tmpdir(), filePath);
 const tempLocalDir = path.dirname(tempLocalFile);
 const tempLocalThumbFile = path.join(os.tmpdir());

 //  if (!event.data.contentType.startsWith('image/')) {
 //   console.log('This is not an image.');
 //   return;
 // }

 // Exit if this is a move or deletion event.
 if (event.data.resourceState === 'not_exists') {
   console.log('This is a deletion event.');
   return;
 }

 // Cloud Storage files.
 const bucket = gcs.bucket(event.data.bucket);
 const file = bucket.file(filePath);

  const mailOptions = {
    from: '"Test Email." <noreply@firebase.com>',
    to: "kevin.bradbury@icloud.com"
  };

    mailOptions.subject = 'A Photo was uploaded to Firebase!';
    mailOptions.text = 'CHeck your Firebase storage to view the new photo.';
    mailOptions.attachments = file;
    return mailTransport.sendMail(mailOptions).then(() => {
      console.log('Image upload email was sent.');
    }).catch(error => {
      console.error('There was an error while sending the email:', error);
    });

});
