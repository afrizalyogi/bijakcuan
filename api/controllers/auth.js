const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const query = require("../database")

const secretKey = require("crypto").randomBytes(32).toString("hex")

const checkPass = async (pass, storedPass) => {
	return bcrypt.compareSync(await pass, await storedPass)
}

const encryptPass = async (password) => {
	const saltRounds = 10
	const salt = bcrypt.genSaltSync(saltRounds)
	const hashedPassword = bcrypt.hashSync(await password, salt)
	return hashedPassword
}

async function daftar(req, res) {
	const { username, name, email, phone, password } = await req.body

	if (
		username === undefined ||
		name === undefined ||
		email === undefined ||
		phone === undefined ||
		password === undefined
	) {
		return res.status(400).json({ failed: "Data tidak lengkap." })
	}

	try {
		const isUserExist = await query(`SELECT * FROM users WHERE username = ?;`, [
			username,
		])

		const isEmailExist = await query(`SELECT * FROM users WHERE email = ?;`, [
			email,
		])

		if (isUserExist.length > 0 && isEmailExist.length > 0) {
			return res.status(200).json({
				failed: "Username dan Email sudah digunakan",
			})
		} else if (isUserExist.length > 0) {
			return res.status(200).json({
				failed: "Username sudah digunakan",
			})
		} else if (isEmailExist.length > 0) {
			return res.status(200).json({
				failed: "Email sudah digunakan",
			})
		} else {
			const hashedPassword = await encryptPass(password)
			await query(
				`
        INSERT INTO users (name, username, email, phone, password)
        VALUES (?, ?, ?, ?, ?);`,
				[name, username, email, phone, hashedPassword]
			)
			return res.status(200).json({
				success: "Akun berhasil dibuat.",
			})
		}
	} catch (err) {
		console.log(err)
	}
}

async function masuk(req, res) {
	const { username, password } = await req.body

	if (username === undefined || password === undefined) {
		return res.status(400).json({ failed: "Data tidak lengkap." })
	}

	try {
		const isUser = await query(
			`SELECT * FROM users WHERE username = ? OR email = ?;`,
			[username, username]
		)

		if (isUser.length === 0) {
			return res.status(200).json({
				wrongUser: "Username tidak terdaftar",
			})
		} else {
			const isPass = await checkPass(password, isUser[0].password)
			if (isPass) {
				const token = jwt.sign(
					{
						id: isUser[0].id,
						username: isUser[0].username,
						name: isUser[0].name,
						email: isUser[0].email,
						phone: isUser[0].phone,
						image: isUser[0]?.image,
					},
					secretKey,
					{ expiresIn: "1h" }
				)
				res.json({ token })
			} else {
				res.status(200).json({
					wrongPass: "Password yang Anda masukan salah",
				})
			}
		}
	} catch (err) {
		console.log(err)
	}
}

module.exports = {
	daftar,
	masuk,
}