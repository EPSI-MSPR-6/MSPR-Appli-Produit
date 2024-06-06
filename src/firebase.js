const admin = require('firebase-admin');
require('dotenv').config();

admin.initializeApp({
    credential: admin.credential.cert({
        clientEmail: "firebase-adminsdk-6zken@mspr-payetonkawa-58875-73430.iam.gserviceaccount.com",
        projectId: "mspr-payetonkawa-58875-73430",
        privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCy7NucoHWbrT2I\nXRUf5xAowJomKEMQh4xA8IpHF1kPmcNxubTb9KfbDNWNQGKKzfgPyEYwZ8FgvPMj\nkJ/s6s3uocpbbZw4gOAkiG95Qv5s/w0WEcKR4TZ7ew6ywYSbXDM594EwSR0zmxiG\n6+KDAlmetHM4I0+lDjw5HP/ghKIiD/JOMNSpqxT39gHjdTUT2kz8YYiK/HLKMSbQ\nut/Bz/kQEvh89qOx04uP2D+nk/ZOLAuxRDEu0nQtFPjS9LIjAUeKRvQdKDH4PxjS\nxmu97oUjywHgAdPiA+HToC3xVFPxmcjKQtap4ZCYLsukMXVI6M7+Dylsx+pI2d88\njEvmAapHAgMBAAECggEAEMOxlfzQ2CvEuqyiCJGxSWg2aUHXesqAgSsogZ216gjJ\nr7OrNvq26YbL0YbJVOEUj4H/1ZQ7IbHChEAOQ/gCIIxHNgbQntiwZ6vi6fU1eofx\nNXKnjNyRqsMubuBD6PycDh/bGmeXVVkAVM/wMr87H2wf6ZAha8EoMl+9t88lk9RL\nkBQEZhoW1mNKoBaqSwrZESiXo+mJk/drtKiY1O770Kk2NGM24guNCWnOgN8xA9k2\nb0x3ViCT/rgNOp3AMUWDCaw6vEV9lkieJeaLKEsCmSXm68SU0eB6amRY2fjKFVX2\njBecDTBNq/rEPudLfQRIKzJLyX82siKMbNGQdWSsDQKBgQDWL192Piul+TtvqhPq\nmKvuha4rswXRpZz8CMz5wLGOeBdTdJ4UG4uG2v8eHi7drUjp5Gf/G0NUfAhe+Si/\nROJZbejHbQ1rvHhprk5pgKF0xncMA5fP8IiJ8gbkaIEnFmva4AGKP1UwYig/6kzL\nFVkok53lcvOim2zJlfUt+He/bQKBgQDV20FUU2wM0KfPWOgfaAS8jwU1l4YA0n2K\n+nIJYJ5P7TfJ51ScIAIkTyv5LEVv4oTxCvZPHCFJCT5MUghduCHgkxdN/56gTfx9\nDPfe7zqO02qDFIeB+aQFXEhgeMSqJsh1sszfPMc/nkER26PR5gbLJVzmg723qgn7\n5EA490ScAwKBgQCsWJxJKke3GzC/bqzuBgG7Qehfk4NoKgqDJ5XAllSJnoquhdU5\nutxwHEJS+tidWfWk9zzTox1vmwqlWXp3RjeY3H8GEfNNsO93omHINVA2Bgj/Ktj6\n4sMLtSvkmU7ro/gPvFag5stmzmUy4RcAB2Kh6v6QBgqT2tsT7s3GOvwolQKBgQC5\nJo61F1Sg87WVyv+M0V3oclqsP3eBFrwiqxo4DDKEOHjokSOr1/qCvRjxLecgKxm2\nJyuA6nXW6e3J3evoWBbce/zdRsZrO5myGpwvoycrqNa6jfeUDDJ5gaAYBfce6Vz8\nqcS+Mby/05+6elKm02RmVP7NhJmofcsPDlqb91irSQKBgCIza8qOPHuL80hRUARO\ngja9LcXWbrKIaCC8KV4KzxycVnDcHIHz7WjTYJvHXCSNiNL+ZKte58y9M0a3hiGt\nPOHqJ42tqXQH/W/ggxD3K3g6Agj0GHomx5o8eu1sDmVG7j0i2pdtrDhO2naKEMPf\nhPSGQjqjDvDrncmRLUzj6jKM\n-----END PRIVATE KEY-----\n"

    })
});


const db = admin.firestore();

module.exports = db;
