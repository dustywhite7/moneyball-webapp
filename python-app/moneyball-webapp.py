
import dash
import dash_core_components as dcc
import dash_html_components as html
import plotly.express as px
import pandas as pd

external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']

app = dash.Dash(__name__, external_stylesheets=external_stylesheets)

# assume you have a "long-form" data frame
# see https://plotly.com/python/px-arguments/ for more options
df = pd.read_csv("https://github.com/dustywhite7/moneyball-webapp/raw/master/data/playersheet2020.csv")

fig = px.histogram(df, x="ops", marginal='box')

app.layout = html.Div(children=[
    html.H1(children='The Moneyball Simulator'),

    html.Div(children='''
        First, a histogram of ops in the data
    '''),

    dcc.Graph(
        id='example-graph',
        figure=fig
    ),

    dcc.Dropdown(
        id = 'selection',
        options = [{'label' : str(df.loc[i,'number']) + " - " + df.loc[i,'first'] + " " + df.loc[i,'last'], 'value': df.loc[i, 'number']} for i in df.index]
    )
])

if __name__ == '__main__':
    app.run_server(debug=True)