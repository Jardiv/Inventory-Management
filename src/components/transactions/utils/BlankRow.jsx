export const BlankRow = ({ columns }) => (
	<tr className="table-row">
		{Array.from({ length: columns }).map((_, index) => (
            <td className="table-data" key={index}>&nbsp;</td>
        ))}
	</tr>
);