const express = require('express');
const sqlite3 = require('sqlite3');
const issuesRouter = express.Router({mergeParams: true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

issuesRouter.param('issueId', (req, res, next, issueId) => {
    db.get(`SELECT * FROM Issue WHERE Issue.id = ${issueId};`, (err, row) => {
        if (err) {
            next(err);
        } else if (row) {
            req.issue = row;
            next();
        } else {
            res.status(404).send();
        }
    });
});

issuesRouter.get('/', (req, res, next) => {
    const seriesId = req.params.seriesId;
    db.all(`SELECT * FROM Issue WHERE Issue.series_id = ${seriesId};`,
      (err, rows) => {
        if (err) {
          next(err);
        } else {
          res.status(200).json({issues: rows});
        }
      });
  });

issuesRouter.post('/', (req, res, next) => {
    const name = req.body.issue.name;
    const issueNumber = req.body.issue.issueNumber;
    const publicationDate = req.body.issue.publicationDate;
    const artistId = req.body.issue.artistId;
    const seriesId = req.params.seriesId;

    if (!name || !issueNumber || !publicationDate || !artistId) {
        res.status(400).send();
    }

    db.get(`SELECT * FROM Artist WHERE Artist.id = ${artistId}`, (err, row) => {
        if (err) {
            res.status(400).send();
        }
    });

    const sql = `INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) 
                VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId);`;
    const values = {$name: name, 
                    $issueNumber: issueNumber,
                    $publicationDate: publicationDate,
                    $artistId: artistId,
                    $seriesId: seriesId};
    
    // NB: Have to use function(err) here instead of an arrow function because of the way "this" works with arrow functions
    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Issue WHERE Issue.id = ${this.lastID};`, (err, row) => {
                res.status(201).json({issue: row});
            });
        }
    });
});

issuesRouter.put('/:issueId', (req, res, next) => {
    const name = req.body.issue.name;
    const issueNumber = req.body.issue.issueNumber;
    const publicationDate = req.body.issue.publicationDate;
    const artistId = req.body.issue.artistId;
    const seriesId = req.params.seriesId;
    const issueId = req.params.issueId;

    if (!name || !issueNumber || !publicationDate || !artistId) {
        res.status(400).send();
    }

    db.get(`SELECT * FROM Artist WHERE Artist.id = ${artistId}`, (err, row) => {
        if (err) {
            res.status(400).send();
        }
    });

    const sql = `UPDATE Issue
                SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId, series_id = $seriesId
                WHERE Issue.id = $issueId;`
    const values = {$name: name,
                    $issueNumber: issueNumber,
                    $publicationDate: publicationDate,
                    $artistId: artistId,
                    $seriesId: seriesId,
                    $issueId: issueId};

    db.run(sql, values, function(err) {
        if (err) {
            next(err);
        } else {
            db.get(`SELECT * FROM Issue WHERE Issue.id = ${issueId};`, (err, row) => {
                res.status(200).json({issue: row});
            });
        }
    });
});

issuesRouter.delete('/:issueId', (req, res, next) => {
    const issueId = req.params.issueId;

    db.run(`DELETE FROM Issue WHERE Issue.id = ${issueId}`, err => {
        if (err) {
            res.status(400).send();
        } else {
            res.status(204).send();
        }
    });
});

module.exports = issuesRouter;