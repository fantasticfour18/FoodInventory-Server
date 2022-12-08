const logger = require('../../config/logger');
const AWS = require('aws-sdk');
const { option } = require('../../models');

/* const DOMAIN = 'sandbox23e4bb0a9391421c85d04d078a56fd83.mailgun.org';
const DOMAIN = "sandbox8f28ca251b384140b68a9fe9b4048603.mailgun.org";
const mg = mailgun({apiKey: '58afb2de5cb59853bc1327478041da74-1f1bd6a9-75932d84', domain: DOMAIN});
const mg = mailgun({apiKey: "51b55b04e8d9c61947d4c13c9c19b2b4-443ec20e-73e0afed", domain: DOMAIN}); */

AWS.config.loadFromPath('./config/aws-ses/aws-ses-config.json');

let sendConfirmationEmail = (orderData, restData) => {
    let htmlData;
    let htmlOwnerData;

    // Order Accepted Template
    if (orderData.orderStatus == 'ACCEPTED') 
    {
        let row = '';
        let itemTotalPrice = 0;

        orderData.itemDetails.forEach(item => {
            itemTotalPrice = parseFloat(item.price);
            itemTotalPrice += (parseFloat(item.variantPrice) + parseFloat(item.subVariantPrice));
            
            let toppingsTotal = 0;
            item.toppings.forEach(topping => {
                toppingsTotal += (parseFloat(topping.price) * parseFloat(topping.toppingCount));
            });

            itemTotalPrice += toppingsTotal;

            // Check for topping and options and append it
            let optionRow = ''
            if(item.option.length) {
                optionRow = `<br> [ ${item.option} ] <br>`;
            }

            item.toppings.forEach(topping => {
                optionRow += ` + ${topping.name} (${topping.price.toFixed(2).replace('.', ',')} € * ${topping.toppingCount}) <br>`
            });

            // Make row With Notes
            if(item.note.length)
            {
                row += `<tr>
                            <td><span style="font-weight: bold;">${item.name}</span> ${optionRow}</td>
                            <td>${item.quantity}</td> 
                            <td>${itemTotalPrice.toFixed(2).replace('.', ',')} €</td>
                        </tr>

                        <tr>
                            <td colspan="3" style ="border-bottom: 1pt solid #7e8780; font-weight: bold;">Notiz - ${item.note}</td>
                        `;
            }
            // Make row without notes
            else 
            {
                row += `<tr>
                            <td style ="border-bottom: 1pt solid #7e8780"><span style="font-weight: bold;">${item.name}</span> ${optionRow}</td>
                            <td style ="border-bottom: 1pt solid #7e8780">${item.quantity}</td> 
                            <td style ="border-bottom: 1pt solid #7e8780">${itemTotalPrice.toFixed(2).replace('.', ',')} €</td>
                        `;
            }

            row += '</tr>';

        })
         
        // Table Footer for total Amount
        row += `<thead>`
        if(orderData.deliveryType == 'DELIVERY') 
        {   
            row += `<tr style="background: #f2f2f2;">
                        <td colspan="2" style="font-weight:bold; text-align: right; font-size: 14px;">Delivery Charge:</td>
                        <td style="font-weight:bold; font-size: 14px;">${orderData.deliveryCharge.toFixed(2).replace('.', ',')} €</td>
                    </tr>`;
                    
        }

        row +=`<tr style="background: #f2f2f2;">
                        <td colspan="2" style="font-weight:bold; text-align: right; font-size: 14px;">Discount:</td>
                        <td style="font-weight:bold; font-size: 14px;">${orderData.discount.toFixed(2).replace('.', ',')} €</td>
                    </tr>
                    <tr style="background: #f2f2f2;">
                        <td colspan="2" style="font-weight:bold; text-align: right; font-size: 14px; border-bottom: 1pt solid #7e8780;">
                            Tip:
                        </td>
                        <td style="font-weight:bold; font-size: 14px; border-bottom: 1pt solid #7e8780;">
                            ${parseFloat(orderData.tip).toFixed(2).replace('.', ',')} €
                        </td>
                    </tr>
                    <tr style="background: #f2f2f2;">
                        <td colspan="2" style="font-weight:bold; color: #33b516; text-align: right; font-size: 16px;">Order Total:</td>
                        <td style="font-weight:bold; color: #33b516; font-size: 16px;">${orderData.totalAmount.toFixed(2).replace('.', ',')} €</td>
                    </tr>
                </thead>`;
      

        let delAddress = "";
        if(orderData.deliveryType == "DELIVERY") {
            delAddress = "<br> " + orderData.deliveryAddress;
        }

        htmlData = `<h1>Hallo ${orderData.userDetails.firstName},</h1>
        <br>
        <p>Vielen Dank, dass Sie Food Inventory verwenden!</p>
        <br>
        <p>Ihre Bestellung Nr. ${orderData.orderNumber} wurde akzeptiert. Ich hoffe, Sie bald wieder bestellen zu sehen.</p>
        <h1 style="text-align: center"> ${restData.restaurantName} </h1>
        <p style="text-align: center"> 
            ${restData.location}
            <br>
            Telefon: ${restData.phoneNumber}
            <br>
            Bestellnummer: ${orderData.orderNumber} 
        </p>
        <hr>
        <p style="text-align: center">
            ${orderData.deliveryType}
            <br>
            Bestätigte Zeit: ${orderData.orderTime}
        </p>
        
        <p style="text-align: center">
            ${orderData.userDetails.firstName} ${orderData.userDetails.lastName}
            ${delAddress}
            <br>
            ${orderData.userDetails.contact}
        </p>
        <hr>

        <br>
        
        <table cellpadding="10 "cellspacing="0" style="width:100%; max-width: 500px; margin: auto;">

        <thead style="background: #f2f2f2">
    
                <tr>
                    <th style="text-align: left">Item Name</th>
                    <th style="text-align: left">Quantity</th>
                    <th style="text-align: left">Price</th>
                </tr>
        </thead>
        <tbody>
            ${row}
        </tbody>
      </table>
      <br> <hr>`;

      // For Owner Template
      htmlOwnerData = `<h1>Hallo</h1>
        <br>
        <p>Vielen Dank, dass Sie Food Inventory verwenden!</p>
        <br>
        <p>Sie haben die Bestellung Nr. ${orderData.orderNumber} angenommen.</p>
        <h1 style="text-align: center"> ${restData.restaurantName} </h1>
        <p style="text-align: center"> 
            ${restData.location}
            <br>
            Telefon: ${restData.phoneNumber}
            <br>
            Bestellnummer: ${orderData.orderNumber} 
        </p>
        <hr>
        <p style="text-align: center">
            ${orderData.deliveryType}
            <br>
            Bestätigte Zeit: ${orderData.orderTime}
        </p>
        
        <p style="text-align: center">
            ${orderData.userDetails.firstName} ${orderData.userDetails.lastName}
            ${delAddress}
            <br>
            ${orderData.userDetails.contact}
        </p>
        <hr>

        <br>
        
        <table cellpadding="10 "cellspacing="0" style="width:100%; max-width: 500px; margin: auto;">

        <thead style="background: #f2f2f2">
    
                <tr>
                    <th style="text-align: left">Item Name</th>
                    <th style="text-align: left">Quantity</th>
                    <th style="text-align: left">Price</th>
                </tr>
        </thead>
        <tbody>
            ${row}
        </tbody>
      </table>
      <br> <hr>`;
      
       // Add Order Note at the end of Table if Available
        if(orderData.note.length)
        {
            htmlData += `<div style="max-width: 500px; margin: auto;">
                            <p>
                                Notiz -
                                <br>
                                ${orderData.note}
                            </p>
                        </div>`

            // For Owner Template
            htmlOwnerData += `<div style="max-width: 500px; margin: auto;">
                                <p>
                                    Notiz -
                                    <br>
                                    ${orderData.note}
                                </p>
                            </div>`
        }

        // For Payment Mode
        htmlData += `<div style="max-width: 500px; margin: auto;">
                        <p style="text-align: center">
                            Zahlungsmethode : ${orderData.paymentMode}
                            <br> <br>
                            ${orderData.paymentMode == 'Barzahlung' ? 'Bestellung wurde nicht online bezahlt' : 
                                'Bestellung wurde online bezahlt <br> Bezahlung Online'}
                        </p>
                    </div>`;

        htmlOwnerData += `<div style="max-width: 500px; margin: auto;">
                            <p style="text-align: center">
                                Zahlungsmethode : ${orderData.paymentMode}
                                <br> <br>
                                ${orderData.paymentMode == 'Barzahlung' ? 'Bestellung wurde nicht online bezahlt' : 
                                    'Bestellung wurde online bezahlt <br> Bezahlung Online'}
                            </p>
                        </div>`;
    }
    // Order Declined Template
    else 
    {
        htmlData = `<h1>Hallo ${orderData.userDetails.firstName},</h1>
        <br>
        <p>Vielen Dank, dass Sie Food Inventory verwenden!</p>
        <h3>Gesamtrückerstattung- ${orderData.totalAmount.toFixed(2).replace('.', ',')} €</h3>
        <p>Ihre Bestellung Nr. ${orderData.orderNumber} wurde abgelehnt. Wir entschuldigen uns für diese Erfahrung 
            und hoffen, dass Sie bald wieder bestellen.</p>
        <br><br>
        <p>Bei Fragen wenden Sie sich bitte an,</p>
        <p>http://namasteindia-de.s3-website-us-west-2.amazonaws.com/</p>
        <br><br>
       `;

       // For Owner Template
       htmlOwnerData = `<h1>Hallo</h1>
        <br>
        <p>Vielen Dank, dass Sie Food Inventory verwenden!</p>
        <p>Sie haben Bestellung Nr. ${orderData.orderNumber} abgelehnt.</p>
        <h3>Gesamtrückerstattung- ${orderData.totalAmount.toFixed(2).replace('.', ',')} €</h3>
       `;
    }

    // Embed Final Html Output
    htmlData = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
    </head>
        <body>
            ${htmlData}
        </body>
    </html>`;

    // For Owner Final Template
    htmlOwnerData = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
    </head>
        <body>
            ${htmlOwnerData}
        </body>
    </html>`;

    logger.info(htmlData);


    // Initialize email configurations
    const email = {
        Destination: {
            ToAddresses: [orderData.userDetails.email]
        },
        Message: {
            Body: {
                Html: { Data: htmlData }
            },
            Subject: { Data: (orderData.orderStatus == 'ACCEPTED') ? 'Bestellung angenommen' : 'Bestellung abgelehnt' }
        },
        Source: 'fooddelivery.de@gmail.com'
    }

    // Send Email using AWS SMTP to customer
    if(orderData.userDetails.email) 
    {
        const mailPromise = new AWS.SES().sendEmail(email).promise();
        mailPromise.then((data) => {
            logger.info('On Fulfilled ', data);
        })
        .catch((err) => {
            logger.info('On Reject ', err);
        });
    }
    
    // Send Email to Restaurant Owner
    if(restData.restEmail)
    {
        email.Destination.ToAddresses = [restData.restEmail];
        email.Message.Body.Html.Data = htmlOwnerData;
    
        const ownerMailPromise = new AWS.SES().sendEmail(email).promise();
        ownerMailPromise.then((data) => {
            logger.info('On Fulfilled ', data);
        })
        .catch((err) => {
            logger.info('On Reject ', err);
        });
    }

}

module.exports = {
    sendConfirmationEmail
}