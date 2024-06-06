import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Nav from "react-bootstrap/Nav";
//import Sentiment from "./sentiment";
import ClientContracts from "./clientContract";
import AgentKpis from "./agentKpis";
import MessageToAgent from "./messageToAgent";
import "../../styles/callCard.css";
import {
  BsStopwatch,
  BsPersonFillCheck,
  BsFillTelephoneOutboundFill,
} from "react-icons/bs";
import { PiCellSignalSlashBold, PiPhoneX, PiTelevisionThin } from "react-icons/pi";
import { IoWarningOutline } from "react-icons/io5";
import { RiZzzFill } from "react-icons/ri";
import { useState, useEffect, useContext } from "react";
import Chat from "./Chatbox";
import GlobalContext from "../GlobalVariable/GlobalContext";
import io from "socket.io-client";
import { toast } from "react-hot-toast";

const socket2 = io("http://127.0.0.1:8080");
const socket = io("http://44.209.22.101:8080");

function CallCard(props) {

  // Show modal containing call details
  const initialTime = Math.floor(Math.random() * 60);

  const [callStatus, setCallStatus] = useState(props.initialCallStatus);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [seconds, setSeconds] = useState(initialTime);
  const { url } = useContext(GlobalContext);
  const [emergencyId, setEmergencyId] = useState("");
  const [Icon, setIcon] = useState(<PiCellSignalSlashBold size={70} color="black" />);

  const emotions = {
    positive: "success",
    negative: "danger",
    neutral: "warning",
    inactivo: "info",
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(seconds => seconds + 1);
    }, 1000);

    // const interval2 = setInterval(() => {
    //   fetch(`http://${url}/llamada/obtenerSentimiento/${props.id}`)
    //     .then(response => response.json())
    //     .then(data => {
    //       setCallStatus(emotions[data.Sentiment]);
    //       console.log(callStatus);
    //     })
    //     .catch(error => console.error('Error:', error));
    // }, 5000);

    if (emergencyId === props.id) {
      setIcon(<RiZzzFill size={70} color="black" />);
    }

    if (!props.estado) {
      setIcon(<RiZzzFill size={70} color="black" />);
    } else {
      switch (props.asunto) {
        case 'internet':
          setIcon(<PiCellSignalSlashBold size={70} color="black" />);
          break;
        case 'telefonia':
          setIcon(<PiPhoneX size={70} color="black" />);
          break;
        case 'television':
          setIcon(<PiTelevisionThin size={70} color="black" />);
          break;
        default:
          setIcon(<PiCellSignalSlashBold size={70} color="black" />);
      }
    }

    const interval2 = setInterval(() => {
      fetch(`http://${url}/llamada/obtenerSentimiento/${props.id}`)
        .then(response => response.json())
        .then(data => {
          if (data.Sentiment !== undefined) {
            setCallStatus(emotions[data.Sentiment]);
            console.log(callStatus);
          }
        })
        .then(() => console.log('Call status:', callStatus))
        .catch(error => console.error('Error:', error));
    }, 2500);

    socket.on("sentiment", ({ sentiment }) => {
      if (sentiment !== undefined) {
        console.log("sentiment", sentiment);
        setCallStatus(emotions[sentiment]);
      }

    })

    socket.on("EMERGENCIA", (pr) => {
      console.log("EMERGENCIA", pr);
      setEmergencyId(pr.id);

      if (pr.id === props.id) {
        setCallStatus("danger");
        setIcon(<IoWarningOutline size={70} color="black" />);

        toast.error(`¡Urgente! ${pr.nombre} ${pr.apellido} necesita ayuda inmediata en la llamada ${pr.id}.`, {
          duration: 5000,
          position: "top-left",
          style: {
            fontSize: '20px', // Cambia esto al tamaño de fuente que prefieras
          }
        });

      }
    })

    return () => {
      clearInterval(interval);
      // clearInterval(interval2);
      socket.off("EMERGENCIA");
      socket.off("sentiment");
      socket2.off("sentiment");
      clearInterval(interval2);
    }
    // Esto limpia el intervalo cuando el componente se desmonta
  }, [props.estado, props.asunto, emergencyId]);

  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;

  // Modal tabs
  const [activeTab, setActiveTab] = useState("liveCall");
  const handleSelect = (k) => setActiveTab(k);

  const renderContent = () => {
    switch (activeTab) {
      case "liveCall":
        return <Chat nombreCliente={props.nombreCliente} nombreAgente={props.nombreAgente} id={props.id} />;
      case "contracts":
        return <ClientContracts celular={props.celular} />;
      case "msg":
        return <MessageToAgent id={props.idEmpleado} />;
      case "kpis":
        return <AgentKpis />;
      default:
        return null;
    }
  };


  return (
    <>
      {/* Call card */}
      <Card style={{ maxWidth: "400px", overflow: "hidden" }}>
        <Row>
          <Col sm={3} md={3} className="pe-0" onClick={handleShow}>
            <div className={`bg-${props.estado ? callStatus : 'info'} callStatus`}>
              {Icon}
            </div>
          </Col>
          <Col sm={9} md={9} className="ps-0">
            <Card.Body className="text-start">
              <Card.Title className="mt-2">{props.nombreAgente}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">{props.nombreCliente}</Card.Subtitle>
              <Card.Text className="fs-6 fw-lighter">
                Descripción: {props.notas}
              </Card.Text>
            </Card.Body>
            <Card.Footer className="fs-6">
              <Container>
                <Row className="row justify-content-between align-items-center text-center">
                  <Col>
                    <div>
                      <BsStopwatch /> <br />
                      {minutes.toString().padStart(2, '0')}:{displaySeconds.toString().padStart(2, '0')}
                    </div>
                  </Col>
                  <Col>
                    <div>
                      <BsPersonFillCheck /> <br />{props.numLlamadas}
                    </div>
                  </Col>
                  <Col>
                    <Button className="btn-sm text-black" variant={props.estado ? callStatus : "info"}>
                      <BsFillTelephoneOutboundFill /> Intervenir
                    </Button>
                  </Col>
                </Row>
              </Container>
            </Card.Footer>
          </Col>
        </Row>
      </Card>

      {/* Modal to display call details */}
      <Modal
        show={show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
        centered
        size="xl"
      >
        <Modal.Body className="px-0 py-0">
          <Card className="border-0">
            <Card.Header>
              <Nav variant="tabs" defaultActiveKey="liveCall" onSelect={handleSelect}>
                <Nav.Item>
                  <Nav.Link eventKey="liveCall">Llamada en vivo</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="contracts">Paquetes del cliente</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="msg">Enviar mensaje</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="kpis">Desempeño del agente</Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header> {/* px-3 py-2 */}

            <Card.Body>
              <Row className="px-3 py-2">
                <Col sm={5} md={5} className="fw-light">
                  <Row>
                    <Card.Title>Información de la llamada</Card.Title>
                    <Card.Subtitle className="mb-4 text-muted">
                      ID: {props.id}
                    </Card.Subtitle>
                  </Row>
                  <Row className="fs-6">
                    <Col className="fw-lighter">
                      <p>Asunto de la llamada</p>
                      <p>Nombre del agente</p>
                      <p>Nombre del cliente</p>
                      <p>Número del cliente</p>
                      <p>Hora de inicio</p>
                      <p>Duración</p>
                    </Col>
                    <Col className="fw-normal">
                      <p>{props.asunto}</p>
                      <p>{props.nombreAgente}</p>
                      <p>{props.nombreCliente}</p>
                      <p>{props.celular}</p>
                      <p>{props.fecha.substring(11, 19)}</p>
                      <p>{minutes.toString().padStart(2, '0')}:{displaySeconds.toString().padStart(2, '0')}</p>
                    </Col>
                  </Row>
                </Col>
                <Col sm={7} md={7} className="ps-4" >{renderContent()}</Col>
              </Row>
            </Card.Body>
          </Card>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
          <Button className="btn-md text-black" variant={callStatus}>
            <BsFillTelephoneOutboundFill /> Intervenir
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default CallCard;