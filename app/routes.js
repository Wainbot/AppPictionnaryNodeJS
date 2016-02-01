module.exports = function(app, mysql, infoConnexion, passport, passwordHasher) {
    app.get('/', function(req, res) {
        if (req.session.user) {
            if (req.session.user.admin == 1) {
                res.redirect('/admin');
            } else {
                res.redirect('/profile');
            }
        } else {
            res.redirect('/login');
        }
    });

    app.get('/login', function(req, res) {
        if (req.session.user) {
            res.redirect("/");
        } else {
            res.render('login');
        }
    });

    app.post('/login', function(req, res) {
        if (req.session.user) {
            res.redirect("/");
        } else {
            var connexion = mysql.createConnection(infoConnexion, function() {
                res.render("login", { erreur: "Problème de connexion à la base de données" })
            });

            connexion.connect();
            connexion.query("SELECT id, nom, prenom, email, profilepic, couleur, admin FROM users WHERE email = '" + req.body.email + "' AND password = '" + passwordHasher.formatRFC2307(passwordHasher.createHash('ssha512', req.body.password, new Buffer('83d88386463f0625', 'hex'))) + "'", req, function(err, rows) {
                if (err) {
                    throw err;
                } else {
                    if (rows.length > 0) {
                        req.session.user = {
                            id: rows[0].id,
                            nom: rows[0].nom,
                            prenom: rows[0].prenom,
                            email: rows[0].email,
                            profilepic: rows[0].profilepic.toString(),
                            admin: rows[0].admin,
                            couleur: rows[0].couleur
                        };

                        if (req.session.user) {
                            res.redirect("/");
                        } else {
                            res.render("login", {erreur: "Une erreur est survenue"});
                        }
                    } else {
                        res.render("login", {erreur: "Adresse email ou mot de passe incorrecte"});
                    }
                }
            });
            connexion.end();
        }
    });

    app.get('/logout', function(req, res) {
        req.session.destroy();
        res.redirect("/");
    });

    app.get('/profile', function(req, res) {
        if (!req.session.user) {
            res.redirect("/login");
        } else {
            infoConnexion.multipleStatements = true;
            var connexion = mysql.createConnection(infoConnexion);
            connexion.connect();
            connexion.query(
                "SELECT id, dessin FROM drawings WHERE id_utilisateur = " + req.session.user.id + " ORDER BY id DESC; " +
                "SELECT u.prenom, u.id as userId, d.dessin, d.id FROM drawings as d, users as u WHERE d.id_utilisateur = u.id AND d.id_utilisateur <> "+req.session.user.id+" ORDER BY id DESC LIMIT 20;"
                , req
                , function(err, rows) {

                if (err) {
                    res.render("profile", { user: req.session.user, erreur: "Une erreur est survenue lors du chargement de tes dessins" });
                } else {
                    res.render("profile", { user: req.session.user, myDraws: rows[0], allDraws : rows[1] });
                }
            });
            connexion.end();
        }
    });

    app.get("/profile/:id", function(req, res) {
        if (!req.session.user) {
            res.redirect("/login");
        } else {
            if (!isNaN(req.params.id)) {
                infoConnexion.multipleStatements = true;
                var connexion = mysql.createConnection(infoConnexion);
                connexion.connect();
                connexion.query("SELECT id, email, nom, prenom, tel, website, sexe, birthdate, ville, taille, couleur, profilepic FROM users WHERE id = " + req.params.id + "; " +
                    "SELECT * FROM drawings WHERE id_utilisateur = " + req.params.id + ";", req, function(err, rows) {
                    if (err) {
                        res.render("user", { user: req.session.user, erreur: "Un problème est survenue lors du chargement de l'utilisateur" })
                    } else {
                        res.render("user", { user: req.session.user, profile: rows[0][0], draws: rows[1] });
                    }
                });
                connexion.end();
            } else {
                res.redirect("/404");
            }
        }
    });

    app.get('/profile-edit/:id', function(req, res) {
        if (!req.session.user) {
            res.redirect("/login");
        } else {
            if (!isNaN(req.params.id)) {
                if (req.session.user.admin == 1 || req.session.user.id == req.params.id) {
                    var connexion = mysql.createConnection(infoConnexion);
                    connexion.connect();
                    connexion.query("SELECT * FROM users WHERE id = " + req.params.id, req, function(err, rows) {
                        if (err) {
                            res.render("profile-edit", { user: req.session.user, profile: rows[0], erreur: "Problème lors du chargement complet du profil" })
                        } else {
                            res.render("profile-edit", { user: req.session.user, profile: rows[0] });
                        }
                    });
                    connexion.end();
                } else {
                    res.redirect("/profile-edit/"+req.session.user.id);
                }
            } else {
                res.redirect("/profile-edit/"+req.session.user.id);
            }
        }
    });

    app.post('/profile-edit', function(req, res) {
        if (!req.session.user) {
            res.redirect("/login");
        } else {
            var connexion = mysql.createConnection(infoConnexion);
            connexion.connect();
            connexion.query("UPDATE users SET nom = '"+req.body.nom+"', prenom = '"+req.body.prenom+"', tel = '"+req.body.tel+"', website = '"+req.body.website+"', sexe = '"+req.body.sexe+"', birthdate = '"+req.body.birthdate+"', ville = '"+req.body.ville+"', taille = "+req.body.taille+", couleur = '"+req.body.couleur.substr(1)+"'" + ((req.body.id_social == "") ? (" , profilepic = '"+req.body.profilepic)+"'" : "") +" WHERE id = " + req.body.id + ";", req, function(err, rows) {
                if (err) {
                    res.render("profile-edit", { user: req.session.user, profile: req.body, erreur: "Problème lors de la modification du profil" })
                } else {
                    if (req.session.user.id == req.body.id) {
                        req.session.user = {
                            id: req.body.id,
                            nom: req.body.nom,
                            prenom: req.body.prenom,
                            email: req.body.email,
                            profilepic: req.body.profilepic,
                            admin: 0,
                            couleur: req.body.couleur
                        };
                    }

                    res.redirect("/profile/"+req.body.id);
                }
            });
            connexion.end();
        }
    });

    app.get('/register', function(req, res) {
        if (req.session.user) {
            res.redirect("/");
        } else {
            res.render('register');
        }
    });

    app.post('/register', function(req, res) {
        if (req.session.user) {
            res.redirect("/");
        } else {
            var connexion = mysql.createConnection(infoConnexion);
            connexion.connect();
            connexion.query("INSERT INTO users (email, password, nom, prenom, tel, website, sexe, birthdate, ville, taille, couleur, profilepic) " +
                "VALUES ('"+req.body.email+"', '"+passwordHasher.formatRFC2307(passwordHasher.createHash('ssha512', req.body.password, new Buffer('83d88386463f0625', 'hex')))+"', '"+req.body.nom+"', '"+req.body.prenom+"', '"+req.body.tel+"', '"+req.body.website+"', '"+req.body.sexe+"', '"+req.body.birthdate+"', '"+req.body.ville+"', "+req.body.taille+", '"+req.body.couleur.substr(1)+"', '"+req.body.profilepic+"')", req, function(err, rows) {
                if (err) {
                    var returnData = req.body;

                    if (err.code == 'ER_DUP_ENTRY') {
                        returnData.erreur = "Adresse email déjà utilisée";
                        res.render("register", returnData)
                    } else {
                        returnData.erreur = "Une erreur est survenue";
                        res.render("register", returnData)
                    }
                } else {
                    req.session.user = {
                        id: rows.insertId,
                        nom: req.body.nom,
                        prenom: req.body.prenom,
                        email: req.body.email,
                        profilepic: req.body.profilepic,
                        admin: 0,
                        couleur: req.body.couleur
                    };

                    if (req.session.user) {
                        res.redirect("/");
                    } else {
                        res.render("register");
                    }
                }
            });
            connexion.end();
        }
    });

    app.get('/paint', function(req, res) {
        if (!req.session.user) {
            res.redirect("/login");
        } else {
            res.render("paint", { user: req.session.user });
        }
    });

    app.post('/paint', function(req, res) {
        if (!req.session.user) {
            res.redirect("/login");
        } else {
            var connexion = mysql.createConnection(infoConnexion);
            connexion.connect();
            connexion.query("INSERT INTO drawings (id_utilisateur, commandes, dessin) VALUES ('"+req.session.user.id+"', '"+req.body.drawingCommands+"', '"+req.body.picture+"')", req, function(err, rows) {
                if (err) {
                    res.render("paint", { erreur: "Une erreur est survenue lors de l'enregistrement du dessin", user: req.session.user })
                } else {
                    res.redirect("/guess/" + rows.insertId);
                }
            });
            connexion.end();
        }
    });

    app.get('/guess/:id', function(req, res) {
        if (!req.session.user) {
            res.redirect("/login");
        } else {
            if (!isNaN(req.params.id)) {
                var connexion = mysql.createConnection(infoConnexion);
                connexion.connect();
                connexion.query("SELECT u.prenom, u.id as userId, d.id, d.commandes, d.dessin FROM drawings as d, users as u WHERE d.id_utilisateur = u.id AND d.id = " + req.params.id, req, function(err, rows) {
                    if (err) {
                        res.render("guess", { user: req.session.user, erreur: "Une erreur est survenue lors du chargement du dessin" })
                    } else {
                        if (rows.length != 0) {
                            res.render("guess", { user: req.session.user, draw: rows[0] });
                        } else {
                            res.redirect("/")
                        }
                    }
                });
                connexion.end();
            } else {
                res.redirect("/404");
            }
        }
    });

    app.get('/delete', function(req, res) {
        if (!req.session.user) {
            res.redirect("/login");
        } else {
            infoConnexion.multipleStatements = true;
            var connexion = mysql.createConnection(infoConnexion);
            connexion.connect();
            connexion.query("DELETE FROM users WHERE id = " + req.session.user.id + "; DELETE FROM drawings WHERE id_utilisateur = " + req.session.user.id + ";", req, function(err) {
                if (err) {
                    res.redirect("/profile/"+req.session.user.id);
                } else {
                    req.session.destroy();
                    res.redirect("/login");
                }
            });
            connexion.end();
        }
    });

    app.get('/delete/:id', function(req, res) {
        if (!req.session.user) {
            res.redirect("/login");
        } else {
            infoConnexion.multipleStatements = true;
            var connexion = mysql.createConnection(infoConnexion);
            connexion.connect();
            connexion.query("DELETE FROM users WHERE id = " + req.params.id + "; DELETE FROM drawings WHERE id_utilisateur = " + req.params.id + ";", req, function(err) {
                if (err) {
                    res.redirect("/profile/"+req.params.id);
                } else {
                    res.redirect("/admin");
                }
            });
            connexion.end();
        }
    });

    app.get('/auth/facebook', passport.authenticate('facebook'));

    app.get('/auth/facebook/callback', passport.authenticate('facebook'), function(req, res) {
        var connexion = mysql.createConnection(infoConnexion);
        connexion.connect();
        connexion.query("INSERT INTO users (id_social, email, nom, prenom, website, sexe, birthdate, ville, profilepic) " +
            "VALUES ("+req.user.id+", '"+req.user.email+"', '"+req.user.nom+"', '"+req.user.prenom+"', '"+req.user.website+"', '"+req.user.sexe+"', '"+ new Date(req.user.birthdate).toMysqlFormat() +"', '"+req.user.ville+"', '"+req.user.profilepic+"')", function(err, rows) {
            if (err) {
                if (err.code == 'ER_DUP_ENTRY') {
                    connexion.query("SELECT id, nom, prenom, email, profilepic, couleur FROM users WHERE email = '" + req.user.email + "' AND id_social = " + req.user.id, function(err, rows) {
                        if (err) {
                            throw err;
                        } else {
                            if (rows.length > 0) {
                                req.session.user = {
                                    id: rows[0].id,
                                    nom: rows[0].nom,
                                    prenom: rows[0].prenom,
                                    email: rows[0].email,
                                    profilepic: rows[0].profilepic.toString(),
                                    admin: 0,
                                    couleur: rows[0].couleur
                                };

                                if (req.session.user) {
                                    res.redirect("/");
                                } else {
                                    res.redirect("/");
                                }
                            } else {
                                res.redirect("/");
                            }

                            connexion.end();
                        }
                    });
                } else {
                    res.redirect("/");
                }
            } else {
                req.session.user = {
                    id: rows.insertId,
                    nom: req.user.nom,
                    prenom: req.user.prenom,
                    email: req.user.email,
                    profilepic: req.user.profilepic,
                    admin: 0,
                    couleur: req.body.couleur
                };

                if (req.session.user) {
                    res.redirect("/");
                } else {
                    res.redirect("/");
                }

                connexion.end();
            }
        });
    });

    app.get("/admin", function(req, res) {
        if (!req.session.user) {
            res.redirect("/login");
        } else {
            if (req.session.user.admin == 1) {
                infoConnexion.multipleStatements = true;
                var connexion = mysql.createConnection(infoConnexion);
                connexion.connect();
                connexion.query(
                    "SELECT * FROM users WHERE id <> "+req.session.user.id+" ORDER BY id; " +
                    "SELECT u.prenom, u.id as userId, d.dessin, d.id FROM drawings as d, users as u WHERE d.id_utilisateur = u.id ORDER BY id;"
                    , req
                    , function(err, rows) {
                        if (err) {
                            res.render("admin", { user: req.session.user, erreur: "Une erreur est survenue lors du chargement de l'administration" });
                        } else {
                            res.render("admin", { user: req.session.user, users: rows[0], draws : rows[1] });
                        }
                    });
                connexion.end();
            } else {
                res.redirect("/");
            }
        }
    });
};

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(1 + this.getUTCDate());
};