const VideoDisplay = ({type, URL, submit}) => {
  const style = {position: "absolute", top: "0"}

  const formStyle = {position:"absolute", bottom: "200px", textAlign: "center", width: "100%"}

  return (<>
    {type === "image" ? <img src={URL} style={style} /> : ""}
    {type === "video" ? <video src={URL} className="display_input" autoPlay loop style={style}></video> : "" }       

    <form style={formStyle} onSubmit={submit}>
        <input type="text" placeholder="Inserir email" name="email" style={{fontSize: "4em"}}></input>
        <input type="submit" value="Enviar" style={{fontSize: "4em"}}></input>
    </form>
  </>
       
  )
}

export default VideoDisplay