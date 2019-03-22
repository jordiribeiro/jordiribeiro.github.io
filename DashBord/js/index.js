function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function compareNumbers(a, b) {
  return a - b;
}
var resultJson;
var objTabela;
var weknumb;
var dayofyear;
var key;
$.ajax({
  url: "https://cors-anywhere.herokuapp.com/" + "http://worldtimeapi.org/api/timezone/Asia/Colombo",
  complete: function(jqXHR, textStatus) {},
  async: false,
  success: function(x) {
    weknumb = x.week_number;
    dayofyear = x.day_of_year;
    $.ajax({
      url: "https://cors-anywhere.herokuapp.com/" + "http://dontpad.com/" + weknumb + "/" + dayofyear + ".txt",
      complete: function(jqXHR, textStatus) {},
      success: function(k) {
        key = k;
        $.ajax({
          url: "https://cors.io/?" + "https://pastebin.com/raw/" + key,
          complete: function(jqXHR, textStatus) {

          },
          success: function(data) {

            json = data;
            retorno = json;
            //console.log(json);

            resultJson = JSON.parse(retorno);

            var App = React.createClass({
              displayName: 'App',
              getInitialState: function getInitialState() {
                return {
                  data: [],
                  series: ['TOTAL', 'TMS', 'WMS', 'I.E', 'CAMISA10', 'PMCYCLE', 'MOFAB', 'INTERACT', 'SEGAMBEV', 'MES', 'QLIKVIEW'],
                  labels: ['Em Tratamento', 'Aguardando Tratamento', 'Total'],
                  colors: ['#007500', '#FF5151', '#4433AF']
                };

              },
              componentDidMount: function componentDidMount() {
                this.populateArray();
                setInterval(this.populateArray, 2000);
              },
              populateArray: async function populateArray() {
                var data = [],
                  series = 11, //getRandomInt(2, 10),
                  serieLength = 3; //getRandomInt(2, 10);
                for (var i = series; i--;) {
                  var tmp = [];
                  if (i == 0) {
                    for (var j = serieLength; j--;) {
                      if (j == 0)
                        tmp.push(resultJson.QLIKVIEW.Total);
                      else if (j == 1)
                        tmp.push(resultJson.QLIKVIEW.StatusDiferente);
                      else if (j == 2)
                        tmp.push(resultJson.QLIKVIEW.EmTratamento);
                    }

                  } else if (i == 1) {
                    for (var j = serieLength; j--;) {
                      if (j == 0)
                        tmp.push(resultJson.MES.Total);
                      else if (j == 1)
                        tmp.push(resultJson.MES.StatusDiferente);
                      else if (j == 2)
                        tmp.push(resultJson.MES.EmTratamento);
                    }
                  } else if (i == 2) {
                    for (var j = serieLength; j--;) {
                      if (j == 0)
                        tmp.push(resultJson.SegAmbev.Total);
                      else if (j == 1)
                        tmp.push(resultJson.SegAmbev.StatusDiferente);
                      else if (j == 2)
                        tmp.push(resultJson.SegAmbev.EmTratamento);
                    }
                  } else if (i == 3) {
                    for (var j = serieLength; j--;) {
                      if (j == 0)
                        tmp.push(resultJson.InterActionLog.Total);
                      else if (j == 1)
                        tmp.push(resultJson.InterActionLog.StatusDiferente);
                      else if (j == 2)
                        tmp.push(resultJson.InterActionLog.EmTratamento);
                    }
                  } else if (i == 4) {
                    for (var j = serieLength; j--;) {
                      if (j == 0)
                        tmp.push(resultJson.modFabril.Total);
                      else if (j == 1)
                        tmp.push(resultJson.modFabril.StatusDiferente);
                      else if (j == 2)
                        tmp.push(resultJson.modFabril.EmTratamento);
                    }
                  } else if (i == 5) {
                    for (var j = serieLength; j--;) {
                      if (j == 0)
                        tmp.push(resultJson.PMCycle.Total);
                      else if (j == 1)
                        tmp.push(resultJson.PMCycle.StatusDiferente);
                      else if (j == 2)
                        tmp.push(resultJson.PMCycle.EmTratamento);
                    }
                  } else if (i == 6) {
                    for (var j = serieLength; j--;) {
                      if (j == 0)
                        tmp.push(resultJson.Camisa10.Total);
                      else if (j == 1)
                        tmp.push(resultJson.Camisa10.StatusDiferente);
                      else if (j == 2)
                        tmp.push(resultJson.Camisa10.EmTratamento);
                    }
                  } else if (i == 7) {
                    for (var j = serieLength; j--;) {
                      if (j == 0)
                        tmp.push(resultJson.IE.Total);
                      else if (j == 1)
                        tmp.push(resultJson.IE.StatusDiferente);
                      else if (j == 2)
                        tmp.push(resultJson.IE.EmTratamento);
                    }
                  } else if (i == 8) {
                    for (var j = serieLength; j--;) {
                      if (j == 0)
                        tmp.push(resultJson.WMS.Total);
                      else if (j == 1)
                        tmp.push(resultJson.WMS.StatusDiferente);
                      else if (j == 2)
                        tmp.push(resultJson.WMS.EmTratamento);
                    }
                  } else if (i == 9) {
                    for (var j = serieLength; j--;) {
                      if (j == 0)
                        tmp.push(resultJson.TMS.Total);
                      else if (j == 1)
                        tmp.push(resultJson.TMS.StatusDiferente);
                      else if (j == 2)
                        tmp.push(resultJson.TMS.EmTratamento);
                    }
                  } else if (i == 10) {
                    for (var j = serieLength; j--;) {
                      if (j == 0)
                        tmp.push(resultJson.totalStats);
                      else if (j == 1)
                        tmp.push(resultJson.TotalAt);
                      else if (j == 2)
                        tmp.push(resultJson.TotalEt);
                    }
                  }
                  data.push(tmp);
                }
                this.setState({
                  data: data
                });
              },
              render: function render() {
                return (
                  React.createElement('section', null,
                    React.createElement(Charts, {
                      data: this.state.data,
                      labels: this.state.series,
                      colors: this.state.colors,
                      height: 300
                    }),


                    React.createElement(Legend, {
                      labels: this.state.labels,
                      colors: this.state.colors
                    })));


              }
            });




            var Legend = React.createClass({
              displayName: 'Legend',
              render: function render() {
                var labels = this.props.labels,
                  colors = this.props.colors;

                return (
                  React.createElement('div', {
                      className: 'Legend col-md-4 col-sm-12 col-xs-6'
                    },
                    labels.map(function(label, labelIndex) {
                      return (
                        React.createElement('div', null,
                          React.createElement('span', {
                            className: 'Legend--color',
                            style: {
                              backgroundColor: colors[labelIndex % colors.length]
                            }
                          }),
                          React.createElement('span', {
                            className: 'Legend--label'
                          }, label)));


                    })));


              }
            });


            var Charts = React.createClass({
              displayName: 'Charts',
              render: function render() {
                var self = this,
                  data = this.props.data,
                  layered = this.props.grouping === 'layered' ? true : false,
                  stacked = this.props.grouping === 'stacked' ? true : false,
                  opaque = this.props.opaque,
                  max = 0;

                for (var i = data.length; i--;) {
                  for (var j = data[i].length; j--;) {
                    if (data[i][j] > max) {
                      max = data[i][j];
                    }
                  }
                }


                return (
                  React.createElement('div', {
                      className: 'Charts' + (this.props.horizontal ? ' horizontal' : '')
                    },
                    data.map(function(serie, serieIndex) {
                      var sortedSerie = serie.slice(0),
                        sum;

                      sum = serie.reduce(function(carry, current) {
                        return carry + current;
                      }, 0);
                      sortedSerie.sort(compareNumbers);

                      return (
                        React.createElement('div', {
                            className: 'Charts--serie ' + self.props.grouping,
                            key: serieIndex,
                            style: {
                              height: self.props.height ? self.props.height : 'auto'
                            }
                          },

                          React.createElement('label', null, self.props.labels[serieIndex]),
                          serie.map(function(item, itemIndex) {
                            var color = self.props.colors[itemIndex],
                              style,
                              size = item / (stacked ? sum : max) * 100;

                            style = {
                              backgroundColor: color,
                              zIndex: item
                            };

                            if (self.props.horizontal) {
                              style['width'] = size + '%';
                            } else {
                              style['height'] = size + '%';
                            }

                            if (layered && !self.props.horizontal) {
                              //console.log(sortedSerie, serie, sortedSerie.indexOf(item));
                              style['right'] = sortedSerie.indexOf(item) / (serie.length + 1) * 100 + '%';
                              // style['left'] = (itemIndex * 10) + '%';
                            }

                            return (
                              React.createElement('div', {
                                  className: 'Charts--item ' + self.props.grouping,
                                  style: style,
                                  key: itemIndex
                                },

                                React.createElement('b', {
                                  style: {
                                    color: color
                                  }
                                }, item)));


                          })));


                    })));


              }
            });


            React.render(React.createElement(App, null), document.getElementById('charts'));
          },
          error: function(xhr, status, error) {

          }
        });
      },
      error: function(xhr, status, error) {

      }
    });

  }
})

setInterval(function() {
    $.ajax({
      url: "https://cors-anywhere.herokuapp.com/" + "http://worldtimeapi.org/api/timezone/Asia/Colombo",
      complete: function(jqXHR, textStatus) {},
      async: false,
      success: function(x) {
        weknumb = x.week_number;
        dayofyear = x.day_of_year;
        $.ajax({
          url: "https://cors-anywhere.herokuapp.com/" + "http://dontpad.com/" + weknumb + "/" + dayofyear + ".txt",
          complete: function(jqXHR, textStatus) {

          },
          success: function(k) {
            key = k;
            $.ajax({
              url: "https://cors.io/?" + "https://pastebin.com/raw/" + key,
              complete: function(jqXHR, textStatus) {
                document.getElementById("StatusPanel").className = "panel panel-success";
                document.getElementById("StatusLbl").innerHTML = 'Sistema operando!';
              },
              success: function(data) {

                json = data;
                retorno = json;
                //console.log(json);

                resultJson = JSON.parse(retorno);
              },
              error: function(xhr, status, error) {
                document.getElementById("StatusPanel").className = "panel panel-danger";
                document.getElementById("StatusLbl").innerHTML = 'Sistema Parado';

              }
            });
          },
          error: function(xhr, status, error) {
            document.getElementById("StatusPanel").className = "panel panel-danger";
            document.getElementById("StatusLbl").innerHTML = 'Sistema Parado';
          }
        });

      }
    })
  },
  40000);
