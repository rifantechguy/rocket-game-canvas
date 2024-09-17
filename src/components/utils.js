export const getDistanceBetweenPoints = (pointA, pointB) =>{
    console.log(pointA,pointB)
    return (pointA.x - pointB.x)**2 + (pointA.y - pointB.y)**2
}