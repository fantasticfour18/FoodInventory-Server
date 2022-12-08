const logger = require('../../config/logger');
const AWS = require('aws-sdk');
const moment = require('moment');

/* const DOMAIN = 'sandbox23e4bb0a9391421c85d04d078a56fd83.mailgun.org';
const DOMAIN = "sandbox8f28ca251b384140b68a9fe9b4048603.mailgun.org";
const mg = mailgun({apiKey: '58afb2de5cb59853bc1327478041da74-1f1bd6a9-75932d84', domain: DOMAIN});
const mg = mailgun({apiKey: "51b55b04e8d9c61947d4c13c9c19b2b4-443ec20e-73e0afed", domain: DOMAIN}); */

AWS.config.loadFromPath('./config/aws-ses/aws-ses-config.json');

let sendReservationEmail = (userData, restEmail) => {
    let htmlData;
    let resvDate = moment(userData.dateOfResv).locale('de').format('DD MMMM YYYY');
    let notes = userData.notes ? userData.notes : 'N/A'; 

    htmlData = `
        <table cellpadding="10" style="width:100%; font-family: arial; max-width: 600px; margin: auto;">
            <tr>
                <th style="text-align: left; border-bottom: 1pt solid #7e8780; background: #f2f2f2;">Kundenname</th>
                <td style="border-bottom: 1pt solid #7e8780;"> ${userData.name} </td>
            </tr>

            <tr>
                <th style="text-align: left; border-bottom: 1pt solid #7e8780; background: #f2f2f2;">Anzahl Person</th>
                <td style="border-bottom: 1pt solid #7e8780;"> ${userData.totalPerson} </td>
            </tr>

            <tr>
                <th style="text-align: left; border-bottom: 1pt solid #7e8780; background: #f2f2f2;">Datum der Reservierung</th>
                <td style="border-bottom: 1pt solid #7e8780;"> ${resvDate} </td>
            </tr>

            <tr>
                <th style="text-align: left; border-bottom: 1pt solid #7e8780; background: #f2f2f2;">Zeitpunkt der Reservierung</th>
                <td style="border-bottom: 1pt solid #7e8780;"> ${userData.timeOfResv} </td>
            </tr>

            <tr>
                <th style="text-align: left; border-bottom: 1pt solid #7e8780; background: #f2f2f2;">Telefon</th>
                <td style="border-bottom: 1pt solid #7e8780;"> ${userData.phoneNumber} </td>
            </tr>

            <tr>
                <th style="text-align: left; border-bottom: 1pt solid #7e8780; background: #f2f2f2;">Email</th>
                <td style="border-bottom: 1pt solid #7e8780;"> ${userData.email} </td>
            </tr>

            <tr>
                <th style="text-align: left; border-bottom: 1pt solid #7e8780; background: #f2f2f2;">Nachricht</th>
                <td style="border-bottom: 1pt solid #7e8780;"> ${notes} </td>
            </tr>
        </table

        `

    //For User Email Data
    const userHtmlData = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
    </head>
        <body>
            <h1>Lieber Gast,</h1>
            <p>
                Ihre Reservierung war erfolgreich!
                <br>
                vielen Dank für Ihre Reservierung!
                <br>
                Ihre Reservierungsdetails:
            </p>
            <br><br>

            ${htmlData}

            <br><br>
            <p style="text-align: center;">
                Wir freuen uns auf Ihren Besuch!
                <br>
                Herzliche Grüße, 
            </p>
            <br>

            <p>
                <b>Gasthaus Zum Engel</b>
                <br> 
                Griechisches Restaurant
                <br>
                Hauptstraße 25,
                <br> 
                65795 Hattersheim am Main.
                <br>
                tel: 06190 3735 
            </p>
        </body>
    </html>`;


    // Embed Final Html Output
    htmlData = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
    </head>
        <body>
            <h1>Hallo</h1>
            <p>Sie haben eine Reservierungsanfrage.</p>
            <br><br>

            ${htmlData}
        </body>
    </html>`;

    logger.info(htmlData);

    // Send Email using AWS SMTP to owner
    const email = {
        Destination: {
            ToAddresses: [restEmail]
        },
        Message: {
            Body: {
                Html: { Data: htmlData }
            },
            Subject: { Data: 'Reservierungsanfrage' }
        },
        Source: 'fooddelivery.de@gmail.com'
    }

    const mailPromise = new AWS.SES().sendEmail(email).promise();
    mailPromise.then((data) => {
        logger.info('On Fulfilled ', data);
    })
    .catch((err) => {
        logger.info('On Reject ', err);
    });

    if(userData.email && userData.email.length) 
    {
        email.Destination.ToAddresses = [userData.email];
        email.Message.Subject.Data = "Tischreservierung bestätigt";
        email.Message.Body.Html.Data = userHtmlData;

        const userMailPromise = new AWS.SES().sendEmail(email).promise();
        userMailPromise.then((data) => {
            logger.info('On Fulfilled ', data);
        })
        .catch((err) => {
            logger.info('On Reject ', err);
        });
    }

}

module.exports = {
    sendReservationEmail
}