from flask import *
from master.controllers.objects import *
from werkzeug.utils import secure_filename
from master.controllers.scripts.importscript import import_dataset_to_db
# disable flask cache from http://stackoverflow.com/a/34067710/1094516

@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r


@app.before_request
def check_ie():
    ua = request.headers.get('User-Agent')
    if "MSIE" in ua or "Trident" in ua:
        return "Access to JuxtaSet using Internet Explorer is not supported. Please use Google Chrome, Mozilla Firefox, Opera or Safari instead."


@app.route('/<dataset>/antibiogram/<antibiogram>', methods=['POST'])
def show_relative_occurences_antibiogram(antibiogram):
    json_result = request.get_json()
    if 'nesting' in json_result:
        return json.dumps(get_patient_object(json_result).antibiogram(antibiogram, json_result['nesting']))
    return json.dumps(get_patient_object(json_result).antibiogram(antibiogram))


@app.route('/<dataset>/statistics', methods=['POST'])
def statistics():
    return json.dumps(get_patient_object(request.get_json()).statistics())


@app.route("/<dataset>/no-records")
def no_records():
    cache = Cache.get_where_query({'records': 0}, '#records')
    if cache:
        return str(cache['result'])
    res = db.query(("SELECT COUNT(*) as c FROM antibiogram_records_imputed",())).fetchone()
    Cache.create({'records': 0}, "#records", int(res['c']), "SELECT COUNT(*) as c FROM antibiogram_records_imputed")
    return str(res['c'])


@app.route('/<dataset>/statistics-resistance-pattern/cache/<cache_id>/pattern/<row_number>', methods=["POST"])
def statistics_resistance_pattern(cache_id, row_number):
    return json.dumps(Cache.data_from_resistance_pattern(int(cache_id), int(row_number), 'statistics'))


@app.route('/<dataset>/get-relevant-resistant-patterns/cache/<cache_id>', methods=["POST"])
def get_relevant_resistant_patterns(cache_id):
    json_result = request.get_json()
    return json.dumps(Cache.data_for_specific_key_value(cache_id, json_result['data']))


@app.route('/<dataset>/data-for-resistant-patterns/patterns/<pattern_ids>/<datatype>/<objecttype>/', methods=["POST"])
@app.route('/<dataset>/data-for-resistant-patterns/patterns/<pattern_ids>/<datatype>/<objecttype>/<extra>', methods=["POST"])
def data_for_resistance_patterns(pattern_ids,datatype,objecttype, extra=None):
    return json.dumps(Cache.data_for_resistance_patterns(get_patient_object(request.get_json()), pattern_ids.split(","), datatype, objecttype, extra))


@app.route("/<dataset>/elements/offset/<offset>/order-by/<orderby>/order/<order>", methods=["POST"])
def get_elements(offset, orderby, order):
    return json.dumps(get_patient_object(request.get_json()).elements(offset, (orderby, order)))


def get_patient_object(json_request_form):
    data = json_request_form['data']
    for d in data:
        if isinstance(d['value'],list):
            d['value'] = sorted(d['value'])
    data = sorted([(d['key'], d['value'], d['queryable']) for d in data], key=lambda x: x[0])
    return Elements(data)


@app.route('/<dataset>/')
def show_visualization():
    return render_template('index.html',
                           categories=Item.all(),
                           items_filtered=Item().list_complement(),
                           visualization=True,
                           colors=Color.all(),
                           color=Color(request.args.get('color')).color,
                           temporal=ds.dataset['temporal'],
                           datasets=ds.all(db))


@app.route('/<dataset>/treatments', methods=["POST"])
def treatments():
    json_result = request.get_json()
    patients = get_patient_object(json_result)
    nested_antibiogram = patients.antibiogram('relative', int(json_result['nesting']))
    return json.dumps({
        'antibiogram': nested_antibiogram,
        'categories': patients.categoriesObj.categories
    })


@app.route('/<dataset>/add-pallette', methods=["POST"])
def add_pallette():
    data = request.form
    new_data = {i.replace('color-',''): ("#" + data[i]) for i in data}
    new_data['name'] = new_data['name'].replace("#", '')
    stringrepl = ', '.join(['%s'] * len(new_data))
    columns = ', '.join(new_data.keys())
    sql = "INSERT INTO colors ( %s ) VALUES ( %s )" % (columns, stringrepl)
    db.insert((sql, [new_data.values()]))
    return redirect(request.referrer, code=200)


@app.route('/')
def home():
    print("DATASET ", db.dataset)
    if db.dataset:
        return redirect('movies')
    else:
        return redirect('upload')


# from http://flask.pocoo.org/docs/0.12/patterns/fileuploads/
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/upload', methods=["GET", "POST"])
def upload_view():
    if request.method == "POST":
        print(request.form)
        # check if the post request has the file part
        if 'csvfile' not in request.files:
            return "no file uploaded"
        file = request.files['csvfile']
        # if user does not select file, browser also
        # submit a empty part without filename
        if file.filename == '':
            return "no selected file"
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            try:
                name = import_dataset_to_db(
                    json.loads(request.form["json"]),
                    os.path.join(app.config['UPLOAD_FOLDER'], filename),
                    request.remote_addr
                )
                return redirect('/' + name)
            except Exception as e:
                return str(e)
        return "ok"
    return render_template('upload-view.html', visualization=False)


if __name__ == '__main__':
    app.run(threaded=True)