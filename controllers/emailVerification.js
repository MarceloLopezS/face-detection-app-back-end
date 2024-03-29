import stringDateToTimestamp from "../utilities/stringDateToTimestamp.js"

const emailVerification = (db, jwt) => (req, res) => {
  const verificationToken = req.params.verificationToken
  jwt.verify(
    verificationToken,
    process.env.TOKEN_VERIFICATION_SECRET,
    (err, decoded) => {
      if (err) {
        return res.redirect(
          302,
          `${process.env.FRONT_END_DOMAIN}/email-verification/error/invalid-token`
        )
      }

      const activateUser = async () => {
        const email = decoded.email
        const selectAuth = "SELECT * FROM auth WHERE email = $1"
        const selectAuthValues = [email]
        try {
          const selectAuthResponse = await db.query(
            selectAuth,
            selectAuthValues
          )
          if (selectAuthResponse.rowCount === 0) {
            throw Error("Email not found.")
          }

          if (
            selectAuthResponse.rows[0].expiration !== "infinity" &&
            stringDateToTimestamp(selectAuthResponse.rows[0].expiration) <
              Date.now()
          ) {
            throw Error("Activation link expired.")
          }

          if (selectAuthResponse.rows[0].activation === "active") {
            return res.redirect(
              302,
              `${process.env.FRONT_END_DOMAIN}/email-verification/activation-success`
            )
          }

          const updateAuth =
            "UPDATE auth SET activation = $1, expiration = $2 WHERE email = $3"
          const updateAuthValues = ["active", "infinity", email]

          const updateAuthResponse = await db.query(
            updateAuth,
            updateAuthValues
          )
          if (updateAuthResponse.rowCount === 0) {
            throw Error("Failed to update database.")
          }

          return res.redirect(
            302,
            `${process.env.FRONT_END_DOMAIN}/email-verification/activation-success`
          )
        } catch (err) {
          console.log(err)
          return res.redirect(302, `${process.env.FRONT_END_DOMAIN}/error`)
        }
      }

      activateUser()
    }
  )
}

export default emailVerification
