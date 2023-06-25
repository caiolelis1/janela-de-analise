import React, { useContext, useState, useEffect } from "react";
import { ChartContext } from "../../../../context/chartContext";
import { Parser } from "json2csv";
import YawWrapper from "../../../../components/chartWrapper/yawWrapper";
import h2p from "./html2pdfs";


const TorqueTotal = () => {
    const chartValues = useContext(ChartContext);
    const [dataX, setDataX] = useState([]);
    const [dataY, setDataY] = useState([]);
    const [csvis, setCsv] = useState();
    const [texto, setTexto] = useState();
    const [nome, setNome] = useState();
    const [subsistema, setSubsistema] = useState();

    useEffect(() => {
        const parser = new Parser();

        const result = chartValues.data.map((value) => {
            const TIMER = +value.TIMER;
            const totalTorque = parseFloat(+value.TORQUE_R) + parseFloat(+value.TORQUE_L) //+value.TorqueT//
            
            return {
              TIMER: TIMER,
              total_torque: totalTorque
            }
        });

        const csv = parser.parse(result);

        setCsv(csv);
        setDataX(result.map((value) => value.TIMER));
        setDataY(result.map((value) => value.total_torque));
    }, [chartValues]);

    function turn2csv() {
      const filename = "TorqueTotal.csv";
      const blob = new Blob([csvis], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
    
      a.setAttribute('href', url)
      a.setAttribute('download', filename);
      a.click()
    };
      
      //tela_impressao = window.open('about:blank');
      //console.log(grafico)
      //tela_impressao.document.write(grafico);
      //tela_impressao.window.print('../../../../../public/images/grafic');
      //tela_impressao.window.close();
    

    const renderChart = () => {
      return (
        <div>
          <br></br>
          <div className="textbox-container">
            <input style={{marginLeft:"10px"}} onChange={(e) => {setNome(e.target.value)}} placeholder=' Nome:' maxLength={63} />  
            <input style={{marginLeft:"10px"}} onChange={(e) => {setSubsistema(e.target.value)}} placeholder=' Subsistema:' maxLength={127} />    
          </div> 
          <div id='printThis'>
          <YawWrapper dataX={dataX} dataY={dataY} />
          </div>
          <div className='button-container'>
            <button onClick={turn2csv} className="export-button">
              Exportar .csv
            </button>
          </div>
          <div className='button-container'>
            <button onClick={(e)=>h2p('Torque Total',texto,nome,subsistema)} className="export-button2">
              PDF
            </button>
          </div>
          <div className="textbox-container">
            <textarea className='textbox-container' onChange={(e) => {setTexto(e.target.value)}} placeholder=' Descrição para o Relatório' rows="4" cols="50" maxLength={1023} />
             
          </div>
        </div>
      );
    };
    
    return (
      <div>
        <div>
          {renderChart()}
        </div>
      </div>
    )
}

export default TorqueTotal

