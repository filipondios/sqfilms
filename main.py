import os
import sqlite3
import uvicorn
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from db import init_db, get_db
from schemas import APIReview, APIToseeItem
from tmdb import build_imdb_url, build_poster_url, fetch_poster_url, normalize_imdb_link, normalize_poster_url

# initializate FastAPI app
app = FastAPI(title='sqfilms')
init_db()

# mount static files (css, js, etc)
if os.path.exists('static'):
    app.mount('/static', StaticFiles(directory='static'), name='static')
templates = Jinja2Templates(directory='templates')


def _serialize_review(row):
    data = dict(row)
    data['imdb_link'] = normalize_imdb_link(data.get('imdb_link'))
    data['imdb_url'] = build_imdb_url(data.get('imdb_link'))
    data['poster_url'] = normalize_poster_url(data.get('poster_url'))
    data['poster_full_url'] = build_poster_url(data.get('poster_url'))
    return data


@app.get('/api/reviews')
def get_reviews(title: Optional[str] = None, sort_by: Optional[str] = None,
    type_filter: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    """ Fetches reviews with optional filtering and sorting """

    if sort_by == 'oldest': order_clause = 'ORDER BY date ASC'
    elif sort_by == 'newest': order_clause = 'ORDER BY date DESC'
    elif sort_by == 'insert_oldest': order_clause = 'ORDER BY id ASC'
    elif sort_by == 'insert_newest' or sort_by is None: order_clause = 'ORDER BY id DESC'
    else: order_clause = 'ORDER BY id DESC'
    clauses, params = [], []
    
    if type_filter == 'films': 
        clauses.append('season IS NULL')
    elif type_filter == 'series': 
        clauses.append('season IS NOT NULL')
    if title:
        clauses.append('LOWER(title) LIKE LOWER(?)')
        params.append(f'%{title}%')

    where_clause = f"WHERE {' AND '.join(clauses)}" if clauses else ''
    sql = f'SELECT * FROM REVIEW {where_clause} {order_clause}'

    try:
        cursor = db.execute(sql, params)
        return [_serialize_review(row) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/reviews')
def create_review(payload: APIReview, db: sqlite3.Connection = Depends(get_db)):
    """ Creates a new review in the database."""

    date_str = payload.date or datetime.now().strftime('%Y-%m-%d')
    compact_imdb_id = normalize_imdb_link(payload.imdb_link)
    poster_url = fetch_poster_url(payload.imdb_link)
    compact_poster_url = normalize_poster_url(poster_url)
    sql = 'INSERT INTO REVIEW (TITLE, NOTE, DATE, SEASON, IMDB_LINK, POSTER_URL) VALUES (?, ?, ?, ?, ?, ?)'
    
    try:
        cursor = db.execute(sql, (payload.title, payload.note, 
            date_str, payload.season, compact_imdb_id, compact_poster_url))
        db.commit()

        return { 'id': cursor.lastrowid, 'title': payload.title,
            'note': payload.note, 'date': date_str,
            'season': payload.season, 'imdb_link': compact_imdb_id,
            'imdb_url': build_imdb_url(compact_imdb_id),
            'poster_url': compact_poster_url,
            'poster_full_url': build_poster_url(compact_poster_url) }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/delete/{id}')
def delete_review(id: int, db: sqlite3.Connection = Depends(get_db)):
    """ Deletes a review from the database """
    try:
        db.execute('DELETE FROM REVIEW WHERE id = ?', (id,))
        db.commit()
        return {'success': 'Review deleted successfully'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put('/api/reviews/{id}')
def update_review(id: int, payload: APIReview, 
    db: sqlite3.Connection = Depends(get_db)):
    """ Updates an existing review in the database. """
    
    compact_imdb_id = normalize_imdb_link(payload.imdb_link)
    poster_url = fetch_poster_url(payload.imdb_link)
    compact_poster_url = normalize_poster_url(poster_url)
    sql = 'UPDATE REVIEW SET TITLE = ?, NOTE = ?, DATE = ?, SEASON = ?, IMDB_LINK = ?, POSTER_URL = ? WHERE ID = ?'
    try:
        db.execute(sql, (payload.title, payload.note, payload.date, payload.season,
            compact_imdb_id, compact_poster_url, id))
        db.commit()
        return {'success': 'Review updated successfully'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/', response_class=HTMLResponse)
def index(request: Request, title: Optional[str] = None,
    sort_by: Optional[str] = None, type_filter: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)):
    """ Renders the main page with reviews, optionally filtered and sorted. """

    reviews = get_reviews(title, sort_by, type_filter, db)
    series = sum(1 for r in reviews if r['season'] is not None)
    films = len(reviews) - series

    return templates.TemplateResponse(request, 'index.html.tera', {
        'title': 'Film & Series Reviews',
        'reviews': reviews, 'series': series, 'films': films,
        'total': len(reviews), 'title_filter': title or '',
        'sort_by': sort_by, 'type_filter': type_filter })


@app.get('/new', response_class=HTMLResponse)
def new_review_form(request: Request):
    """ Renders the form for creating a new review. """
    return templates.TemplateResponse(request, 'new.html.tera',
        {'title': 'Add New Review'})


@app.get('/edit/{id}', response_class=HTMLResponse)
def edit_review_form(request: Request, id: int, 
    db: sqlite3.Connection = Depends(get_db)):
    """ Renders the form for editing an existing review. """

    cursor = db.execute('SELECT * FROM REVIEW WHERE ID = ?', (id,))
    row = cursor.fetchone()
    review = _serialize_review(row) if row else None

    return templates.TemplateResponse(request, 'edit.html.tera',
        {'title': 'Edit Review', 'review': review})


def _serialize_tosee_item(row):
    data = dict(row)
    data['imdb_link'] = normalize_imdb_link(data.get('imdb_link'))
    data['imdb_url'] = build_imdb_url(data.get('imdb_link'))
    data['poster_url'] = normalize_poster_url(data.get('poster_url'))
    data['poster_full_url'] = build_poster_url(data.get('poster_url'))
    return data


@app.get('/api/tosee')
def get_tosee_items(title: Optional[str] = None, media_filter: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)):
    """Fetches pending movies/series with optional filtering."""

    clauses, params = [], []
    if media_filter == 'movies':
        clauses.append('media_type = ?')
        params.append('movie')
    elif media_filter == 'series':
        clauses.append('media_type = ?')
        params.append('series')
    if title:
        clauses.append('LOWER(title) LIKE LOWER(?)')
        params.append(f'%{title}%')

    where_clause = f"WHERE {' AND '.join(clauses)}" if clauses else ''
    sql = f'SELECT * FROM TOSEE {where_clause} ORDER BY id DESC'

    try:
        cursor = db.execute(sql, params)
        return [_serialize_tosee_item(row) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/tosee')
def create_tosee_item(payload: APIToseeItem, db: sqlite3.Connection = Depends(get_db)):
    """Creates a new item in the to-see list."""

    compact_imdb_id = normalize_imdb_link(payload.imdb_link)
    sql = 'INSERT INTO TOSEE (TITLE, MEDIA_TYPE, IMDB_LINK, SEASONS) VALUES (?, ?, ?, ?)'
    try:
        cursor = db.execute(sql, (payload.title, payload.media_type,
            compact_imdb_id, payload.seasons))
        db.commit()
        return {
            'id': cursor.lastrowid,
            'title': payload.title,
            'media_type': payload.media_type,
            'imdb_link': compact_imdb_id,
            'imdb_url': build_imdb_url(compact_imdb_id),
            'seasons': payload.seasons,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/tosee/delete/{id}')
def delete_tosee_item(id: int, db: sqlite3.Connection = Depends(get_db)):
    """Deletes an item from the to-see list."""

    try:
        db.execute('DELETE FROM TOSEE WHERE id = ?', (id,))
        db.commit()
        return {'success': 'To-see item deleted successfully'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/tosee', response_class=HTMLResponse)
def tosee_page(request: Request, title: Optional[str] = None,
    media_filter: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    """Renders the to-see page."""

    items = get_tosee_items(title, media_filter, db)
    return templates.TemplateResponse(request, 'tosee.html.tera', {
        'title': 'Series and Films to see',
        'items': items,
        'title_filter': title or '',
        'media_filter': media_filter or 'all',
    })


@app.get('/tosee/new', response_class=HTMLResponse)
def new_tosee_form(request: Request):
    """Renders the form for creating a new to-see item."""
    return templates.TemplateResponse(request, 'tosee-new.html.tera', {
        'title': 'Add To See Item'
    })


# Public-facing routes used by the frontend (aliases without /api prefix)
@app.get('/reviews')
def get_reviews_public(title: Optional[str] = None, 
    sort_by: Optional[str] = None, type_filter: Optional[str] = None, 
    db: sqlite3.Connection = Depends(get_db)):
    return get_reviews(title, sort_by, type_filter, db)


@app.post('/reviews')
def create_review_public(payload: APIReview, 
    db: sqlite3.Connection = Depends(get_db)):
    return create_review(payload, db)


@app.put('/reviews/{id}')
def update_review_public(id: int, payload: APIReview, 
    db: sqlite3.Connection = Depends(get_db)):
    return update_review(id, payload, db)


@app.post('/delete/{id}')
def delete_review_public(id: int, 
    db: sqlite3.Connection = Depends(get_db)):
    return delete_review(id, db)


@app.get('/tosee-items')
def get_tosee_items_public(title: Optional[str] = None,
    media_filter: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    return get_tosee_items(title, media_filter, db)


@app.post('/tosee')
def create_tosee_item_public(payload: APIToseeItem,
    db: sqlite3.Connection = Depends(get_db)):
    return create_tosee_item(payload, db)


@app.post('/tosee/delete/{id}', response_class=HTMLResponse)
def delete_tosee_item_public(request: Request, id: int,
    db: sqlite3.Connection = Depends(get_db)):
    delete_tosee_item(id, db)
    return RedirectResponse(url='/tosee', status_code=303)


if __name__ == '__main__':
    uvicorn.run('main:app', host='127.0.0.1', 
        port=8000, reload=True)